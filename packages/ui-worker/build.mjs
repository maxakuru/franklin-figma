import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import fs from 'fs/promises';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

/**
 * @param {string} code 
 * @returns {string}
 */
 const template = (code) => { 
  return `
<script>
  ${code}
</script>
<h1>HELLo</h1>
`;
}

const emitDeclaration = async () => {
  await new Promise((resolve, reject) => {
    exec('tsc --emitDeclarationOnly --declaration --project tsconfig.types.json', (err, stdout) => {
      if(err) {
        console.error('emitDeclaration failed: ', stdout);
        reject(stdout);
      } else {
        resolve(stdout);
      }
    });
  });
} 

const writeHtml = async () => {
  const buf = await fs.readFile(path.resolve(__dirname, './dist/ui/index.js'));
  const code = buf.toString('utf8');

  const html = template(code);
  await fs.writeFile(path.resolve(__dirname, './dist/ui/index.html'), html, {encoding: 'utf8'});
  await fs.unlink(path.resolve(__dirname, './dist/ui/index.js'));

}

const onRebuild = (pkg) => async (error, result) => {
  if (error) {
    console.error('watch build failed: ', error);
  }
  else if (result.warnings.length) {
    console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  }
  else {
    if(pkg === 'ui') {
      await writeHtml();
    } else {
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
    watch: watch ? { onRebuild } : false,
    target: 'es2017',
    define: {},
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  };
  await Promise.all([
    build({
      ...common,
      watch: watch ? { onRebuild: onRebuild('api') } : false,
      outdir: path.resolve(__dirname, 'dist/api'),
      entryPoints: [
        path.resolve(__dirname, 'src/api/index.ts'),
      ],
      external: ['@franklin-figma/messages']
    }), 
    build({
      ...common,
      watch: watch ? { onRebuild: onRebuild('ui') } : false,
      outdir: path.resolve(__dirname, 'dist/ui'),
      entryPoints: [
        path.resolve(__dirname, 'src/ui/index.ts')
      ]
    }), 
  ]);

  await writeHtml();
  await emitDeclaration();

} catch (e) {
  console.error('build failed: ', e);
  process.exitCode = 1;
}
