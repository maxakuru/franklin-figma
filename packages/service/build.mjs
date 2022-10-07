import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { config as configEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

configEnv({ path: path.resolve(__dirname, '../../.public.env') });
configEnv({ path: path.resolve(__dirname, './.env') });

const dev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

const variableEnvVars = (env) => {
  if (typeof env === 'undefined') {
    console.warn('NODE_ENV not set, defaulting to `development`');
    // eslint-disable-next-line no-multi-assign, no-param-reassign
    process.env.NODE_ENV = (env = 'development');
  }

  if (!['stage', 'production', 'development'].includes(env)) {
    throw Error(`Invalid environment: '${env}`);
  }

  let endpoint;
  let uiEndpoint;
  if (env === 'production') {
    endpoint = process.env.AUTH_ENDPOINT_PROD;
    uiEndpoint = process.env.UI_ENDPOINT_PROD;
  } else if (env === 'stage') {
    endpoint = process.env.AUTH_ENDPOINT_STAGE;
    uiEndpoint = process.env.UI_ENDPOINT_STAGE;
  } else {
    endpoint = process.env.AUTH_ENDPOINT_DEV;
    uiEndpoint = process.env.UI_ENDPOINT_DEV;
  }

  return {
    'process.env.ENDPOINT': JSON.stringify(endpoint),
    'process.env.UI_ENDPOINT': JSON.stringify(uiEndpoint),
  };
};

try {
  await build({
    bundle: true,
    sourcemap: true,
    format: 'esm',
    target: 'esnext',
    define: {
      ...variableEnvVars(process.env.NODE_ENV),
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
