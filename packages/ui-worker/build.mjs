import path from 'path';
import { fileURLToPath } from 'url';
import { context } from 'esbuild';
import { exec } from 'child_process';
import { config as configEnv } from 'dotenv';
import { messageBusPlugin } from '@franklin-figma/vendor';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

configEnv({ path: path.resolve(__dirname, '../../.public.env') });

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const emitDeclaration = async () => {
  await new Promise((resolve, reject) => {
    exec('tsc --emitDeclarationOnly --declaration --project tsconfig.types.json', (err, stdout) => {
      if(err) {
        console.error('[ui-worker] emitDeclaration failed: ', stdout);
        reject(stdout);
      } else {
        resolve(stdout);
      }
    });
  });
} 

const onRebuildPlugin = (pkg) => ({
  name: 'onrebuild-plugin',
  setup({
    onEnd
  }) {
      onEnd(async ({ errors, warnings }) => {
        if (errors.length) console.error('watch build failed: ', errors);
        else if (warnings.length) console.warn(`watch build succeeded with ${warnings.length} warnings: `, warnings);
        else {
          if(pkg === 'api') {
            await emitDeclaration();
          }
          console.debug('watch build succeeded');
        }
      });
  }
})

try {
  const common = {
    bundle: true,
    sourcemap: dev && 'inline',
    format: 'esm',
    target: 'es2017',
    external: ['@franklin-figma/messages'],
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  };
  const [apiCtx, workerCtx] = await Promise.all([
    context({
      ...common,
      outdir: path.resolve(__dirname, 'dist'),
      entryPoints: [
        path.resolve(__dirname, 'src/api/index.ts'),
      ],
      plugins: [
        watch && onRebuildPlugin('api')
      ].filter(p => !!p)
    }), 
    context({
      ...common,
      outdir: path.resolve(__dirname, '../../public/plugin/worker'),
      plugins: [
        messageBusPlugin,
        watch && onRebuildPlugin('worker')
      ].filter(p => !!p),
      entryPoints: [
        path.resolve(__dirname, 'src/ui/index.ts')
      ],
    }), 
  ]);

  await emitDeclaration();

  if(watch) {
    await Promise.all([apiCtx.watch(), workerCtx.watch()]);
  } else {
    await Promise.all([apiCtx.rebuild(), workerCtx.rebuild()]);
    await Promise.all([apiCtx.dispose(), workerCtx.dispose()]);
  }


} catch (e) {
  console.error('[ui-worker] build failed: ', e);
  process.exitCode = 1;
}
