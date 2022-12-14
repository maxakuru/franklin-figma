import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const emitDeclaration = async () => {
  await new Promise((resolve, reject) => {
    exec('tsc --emitDeclarationOnly --declaration --project tsconfig.json', (err, stdout) => {
      if(err) {
        console.error('emitDeclaration failed: ', stdout);
        reject(stdout);
      } else {
        resolve(stdout);
      }
    });
  });
} 

const onRebuild = async (error, result) => {
  if (error) console.error('watch build failed: ', error);
  else if (result.warnings.length) console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  else {
    await emitDeclaration();
    console.debug('watch build succeeded');
  }
};

try {
  await build({
    bundle: true,
    sourcemap: dev ? 'inline' : false,
    format: 'esm',
    watch: watch ? { onRebuild } : false,
    target: 'es2017',
    define: {},
    loader: {
      '.svg': 'text'
    },
    external: ['@franklin-figma/messages'],
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    outdir: path.resolve(__dirname, 'dist'),
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  });

  await emitDeclaration();
  
} catch (e) {
  console.error('[widgets] build failed: ', e);
  process.exitCode = 1;
}
