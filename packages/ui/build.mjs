import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import fs from 'fs/promises';
import { config as configEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

configEnv({ path: path.resolve(__dirname, './.public.env') });
configEnv({ path: path.resolve(__dirname, './.env') });

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
  if (error) {
    console.error('watch build failed: ', error);
  }
  else if (result.warnings.length) {
    console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  }
  else {
    await writeHtml();
    console.debug('watch build succeeded');
  }
};

const variableEnvVars = (env) => {
  if (typeof env === 'undefined') {
    console.warn('NODE_ENV not set, defaulting to `development`');
    // eslint-disable-next-line no-multi-assign, no-param-reassign
    process.env.NODE_ENV = (env = 'development');
  }

  if (!['stage', 'production', 'development'].includes(env)) {
    throw Error(`Invalid environment: '${env}`);
  }

  let authEndpoint;
  let uiEndpoint;
  if (env === 'production') {
    authEndpoint = process.env.AUTH_ENDPOINT_PROD;
    uiEndpoint = process.env.UI_ENDPOINT_PROD;
  } else if (env === 'stage') {
    authEndpoint = process.env.AUTH_ENDPOINT_STAGE;
    uiEndpoint = process.env.UI_ENDPOINT_STAGE;
  } else {
    authEndpoint = process.env.AUTH_ENDPOINT_DEV;
    uiEndpoint = process.env.UI_ENDPOINT_DEV;
  }

  return {
    'process.env.NODE_ENV': JSON.stringify(env),
    'process.env.AUTH_ENDPOINT': JSON.stringify(authEndpoint),
    'process.env.UI_ENDPOINT': JSON.stringify(uiEndpoint),
  };
};

try {
  const res = await build({
    bundle: true,
    sourcemap: dev && 'inline',
    format: 'esm',
    watch: watch ? { onRebuild } : false,
    target: 'es2017',
    define: {
      'process.env.OAUTH_FLOW': JSON.stringify(process.env.OAUTH_FLOW ?? 'device_code'),
      'process.env.MICROSOFT_TENANT_ID': JSON.stringify(process.env.MICROSOFT_TENANT_ID),
      'process.env.MICROSOFT_CLIENT_ID': JSON.stringify(process.env.MICROSOFT_CLIENT_ID),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
      'process.env.GOOGLE_DEVICECODE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_DEVICECODE_CLIENT_ID),
      ...variableEnvVars(process.env.NODE_ENV),
    },
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
