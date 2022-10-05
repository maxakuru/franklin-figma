import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';

try {
  await build({
    bundle: true,
    sourcemap: true,
    format: 'esm',
    target: 'esnext',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
      'process.env.GOOGLE_CLIENT_SECRET': JSON.stringify(process.env.GOOGLE_CLIENT_SECRET),
      'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY),
      'process.env.GOOGLE_DEVICECODE_CLIENT_SECRET': JSON.stringify(process.env.GOOGLE_DEVICECODE_CLIENT_SECRET),
      'process.env.MICROSOFT_CLIENT_ID': JSON.stringify(process.env.MICROSOFT_CLIENT_ID),
      'process.env.MICROSOFT_CLIENT_SECRET': JSON.stringify(process.env.MICROSOFT_CLIENT_SECRET),
      'process.env.UPSTREAM': dev && process.env.UPSTREAM ? JSON.stringify(process.env.UPSTREAM) : '""',
    },
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.join(__dirname, 'src', 'index.ts')],
    outdir: path.join(__dirname, 'dist'),
    outExtension: { '.js': '.mjs' },
    tsconfig: path.join(__dirname, './tsconfig.json'),
  });
} catch (e) {
  console.error('[service] build failed: ', e);
  process.exitCode = 1;
}
