import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
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

const onRebuild = (pkg) => async (error, result) => {
  if (error) {
    console.error('watch build failed: ', error);
  }
  else if (result.warnings.length) {
    console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  }
  else {
    if(pkg === 'api') {
      await emitDeclaration();
    }
    console.debug('watch build succeeded');
  }
};

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
  await Promise.all([
    build({
      ...common,
      watch: watch ? { onRebuild: onRebuild('api') } : false,
      outdir: path.resolve(__dirname, 'dist'),
      entryPoints: [
        path.resolve(__dirname, 'src/api/index.ts'),
      ],
    }), 
    build({
      ...common,
      watch: watch ? { onRebuild: onRebuild('ui') } : false,
      outdir: path.resolve(__dirname, '../../public/plugin/worker'),
      plugins: [
        messageBusPlugin
      ],
      entryPoints: [
        path.resolve(__dirname, 'src/ui/index.ts')
      ]
    }), 
  ]);

  await emitDeclaration();

} catch (e) {
  console.error('[ui-worker] build failed: ', e);
  process.exitCode = 1;
}
