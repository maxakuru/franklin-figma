import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import fs from 'fs/promises';

// import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// config({ path: path.resolve(__dirname, './.env') });

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

/**
 * @param {string} code 
 * @returns {string}
 */
 const template = (code) => { 
  return `
<div id="app"></div>
<script>
  ${code}
</script>
`;
}

const writeHtml = async () => {
  const buf = await fs.readFile(path.resolve(__dirname, './dist/index.js'));
  const code = buf.toString('utf8');
  const html = template(code);
  await fs.writeFile(path.resolve(__dirname, './dist/index.html'), html, {encoding: 'utf8'});
  await fs.unlink(path.resolve(__dirname, './dist/index.js'));
}

const onRebuild = async (error, result) => {
  if (error) console.error('watch build failed: ', error);
  else if (result.warnings.length) console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  else {
    await writeHtml();
    console.debug('watch build succeeded');
  }
};

try {
  const res = await build({
    bundle: true,
    sourcemap: dev && 'inline',
    format: 'esm',
    watch: watch ? { onRebuild } : false,
    target: 'es2017',
    define: {},
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.tsx')],
    outdir: path.resolve(__dirname, 'dist'),
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  });

  await writeHtml();
} catch {
  process.exitCode = 1;
}
