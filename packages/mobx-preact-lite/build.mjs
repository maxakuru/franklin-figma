import path from 'path';
import { fileURLToPath } from 'url';
import { context } from 'esbuild';
import { config as configEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

configEnv({ path: path.resolve(__dirname, './.public.env') });
configEnv({ path: path.resolve(__dirname, './.env') });

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const onRebuildPlugin = {
  name: 'onrebuild-plugin',
  setup({
    onEnd
  }) {
      onEnd(({ errors, warnings }) => {
        if (errors.length) console.error('watch build failed: ', errors);
        else if (warnings.length) console.warn(`watch build succeeded with ${warnings.length} warnings: `, warnings);
        else console.debug('watch build succeeded');
      });
  }
}

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
  const ctx = await context({
    bundle: true,
    sourcemap: dev && 'inline',
    format: 'esm',
    target: 'es2017',
    external: ['preact', 'preact/compat', 'react', 'react-dom', 'mobx'],
    define: {},
    plugins: [
      preactCompatPlugin,
      watch && onRebuildPlugin
    ].filter(p => !!p),
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    outdir: path.resolve(__dirname, 'dist'),
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
  });
  if(watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
} catch(e) {
  console.error('[mobx-preact-lite] build failed: ', e);
  process.exitCode = 1;
}
