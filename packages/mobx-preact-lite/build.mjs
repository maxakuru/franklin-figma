import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { config as configEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

configEnv({ path: path.resolve(__dirname, './.public.env') });
configEnv({ path: path.resolve(__dirname, './.env') });

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const onRebuild = async (error, result) => {
  if (error) {
    console.error('watch build failed: ', error);
  }
  else if (result.warnings.length) {
    console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  }
  else {
    console.debug('watch build succeeded');
  }
};

const preactCompatPlugin = {
  name: 'preact-compat-plugin',
  setup({ onResolve }) {
    onResolve({ filter: /^react(-dom)?$/ }, (args) => {
      return {
        path: `preact/compat`,
        namespace: 'ns-preact-compat',
        external: true
      }
    });
  },
};

try {
  await build({
    bundle: true,
    sourcemap: dev && 'inline',
    format: 'esm',
    watch: watch ? { onRebuild } : false,
    target: 'es2017',
    external: ['preact', 'preact/compat', 'react', 'react-dom', 'mobx'],
    define: {},
    plugins: [
      preactCompatPlugin
    ],
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    outdir: path.resolve(__dirname, 'dist'),
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
  });
} catch(e) {
  console.error('[mobx-preact-lite] build failed: ', e);
  process.exitCode = 1;
}
