import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { config as configEnv } from 'dotenv';
import { preactPlugin, messageBusPlugin } from '@franklin-figma/vendor';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

configEnv({ path: path.resolve(__dirname, '../../.public.env') });
configEnv({ path: path.resolve(__dirname, './.env') });

const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const onRebuild = async (error, result) => {
  if (error) {
    console.error('watch build failed: ', error);
  }
  else if (result.warnings.length) {
    console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  }
  else {
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
    'process.env.AUTH_ENDPOINT': JSON.stringify(process.env.AUTH_ENDPOINT ?? authEndpoint),
    'process.env.UI_ENDPOINT': JSON.stringify(process.env.UI_ENDPOINT ?? uiEndpoint),
  };
};

try {
  await build({
    bundle: true,
    sourcemap: dev ? 'inline': false,
    format: 'esm',
    assetNames: '[dir][name]',
    watch: watch ? { onRebuild } : false,
    target: 'es2017',
    external: ['preact', '@franklin-figma/messages'],
    define: {
      'process.env.OAUTH_FLOW': JSON.stringify(process.env.OAUTH_FLOW ?? 'access_code'),
      'process.env.MICROSOFT_TENANT_ID': JSON.stringify(process.env.MICROSOFT_TENANT_ID),
      'process.env.MICROSOFT_CLIENT_ID': JSON.stringify(process.env.MICROSOFT_CLIENT_ID),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
      'process.env.GOOGLE_DEVICECODE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_DEVICECODE_CLIENT_ID),
      'process.env.PLUGIN_ID': JSON.stringify(process.env.PLUGIN_ID),
      'process.env.DEV': JSON.stringify(dev),
      ...variableEnvVars(process.env.NODE_ENV),
    },
    plugins: [
      preactPlugin,
      messageBusPlugin
    ],
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.tsx')],
    outdir: path.resolve(__dirname, '../../public/plugin/ui'),
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  });

  // if(!watch) {
  //   // build react into web ui
  //   await build({
  //     bundle: true,
  //     minify: true,
  //     treeShaking: false,
  //     keepNames: true,
  //     format: 'esm',
  //     target: 'es2017',
  //     define: {
  //       'process.env.NODE_ENV': '"production"',
  //     },
  //     outExtension: {
  //       '.js': '.min.js',
  //     },
  //     entryPoints: [
  //       path.resolve(__dirname, 'polyfills/preact.mjs'),
  //     ],
  //     outdir: path.resolve(__dirname, '../../public/scripts'),
  //   });
  // }
} catch(e) {
  console.error('[ui] build failed: ', e);
  process.exitCode = 1;
}
