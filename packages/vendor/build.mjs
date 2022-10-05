import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { exec } from 'child_process'
import { config as configEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

configEnv({ path: path.resolve(__dirname, '../../.public.env') });
configEnv({ path: path.resolve(__dirname, './.env') });

const dev = process.env.NODE_ENV === 'development';
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const emitDeclaration = async () => {
  await new Promise((resolve, reject) => {
    exec('tsc --emitDeclarationOnly --declaration --project tsconfig.types.json', (err, stdout) => {
      if(err) {
        console.error('[vendor] emitDeclaration failed: ', stdout);
        reject(stdout);
      } else {
        resolve(stdout);
      }
    });
  });
} 

const onRebuild = async (error, result) => {
  if (error) {
    console.error('watch build failed: ', error);
  }
  else if (result.warnings.length) {
    console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  }
  else {
    await emitDeclaration();
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
    minify: true,
    treeShaking: false,
    keepNames: true,
    format: 'esm',
    target: 'es2017',
    define: {
      'process.env.PLUGIN_ID': JSON.stringify(process.env.PLUGIN_ID),
      ...variableEnvVars('production')
    },
    outExtension: {
      '.js': '.min.js',
    },
    entryPoints: [
      path.resolve(__dirname, 'src/lib/preact.ts'),
      path.resolve(__dirname, 'src/lib/MessageBus.ts'),
    ],
    outdir: path.resolve(__dirname, '../../public/vendor'),
  });

  await build({
    bundle: true,
    sourcemap: dev ? 'inline': false,
    format: 'esm',
    assetNames: '[dir][name]',
    watch: watch ? { onRebuild } : false,
    target: 'es2017',
    define: {
      'process.env.PLUGIN_ID': JSON.stringify(process.env.PLUGIN_ID),
      'process.env.DEV': JSON.stringify(dev),
      ...variableEnvVars(process.env.NODE_ENV),
    },
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    outdir: path.resolve(__dirname, 'dist'),
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
  });
  await emitDeclaration();
  
} catch(e) {
  console.error('[vendor] build failed: ', e);
  process.exitCode = 1;
}
