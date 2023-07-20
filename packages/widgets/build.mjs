import path from 'path';
import { fileURLToPath } from 'url';
import { context } from 'esbuild';
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

const onRebuildPlugin = {
  name: 'onrebuild-plugin',
  setup({
    onEnd
  }) {
      onEnd(async ({ errors, warnings }) => {
        if (errors.length) console.error('watch build failed: ', errors);
        else if (warnings.length) console.warn(`watch build succeeded with ${warnings.length} warnings: `, warnings);
        else {
          await emitDeclaration();
          console.debug('watch build succeeded');
        }
      });
  }
}

try {
  const ctx = await context({
    bundle: true,
    sourcemap: dev ? 'inline' : false,
    format: 'esm',
    target: 'es2017',
    define: {},
    loader: {
      '.svg': 'text'
    },
    plugins: [
      watch && onRebuildPlugin
    ].filter(p => !!p),
    external: ['@franklin-figma/messages'],
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    outdir: path.resolve(__dirname, 'dist'),
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  });

  await emitDeclaration();

  if(watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
  
} catch (e) {
  console.error('[widgets] build failed: ', e);
  process.exitCode = 1;
}
