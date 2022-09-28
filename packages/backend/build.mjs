/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
// import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// config({ path: path.resolve(__dirname, './.env') });

process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';

const onRebuild = (error, result) => {
  if (error) console.error('watch build failed: ', error);
  else if (result.warnings.length) console.warn(`watch build succeeded with ${result.warnings.length} warnings: `, result);
  else console.debug('watch build succeeded');
};

try {
  await build({
    bundle: true,
    sourcemap: dev,
    format: 'esm',
    target: 'es2017',
    define: {},
    watch: process.argv.includes('--watch') || process.argv.includes('-w') ? { onRebuild } : false,
    minify: !dev,
    treeShaking: true,
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    outdir: path.resolve(__dirname, 'dist'),
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  });
} catch {
  process.exitCode = 1;
}
