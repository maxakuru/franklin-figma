import type { Plugin } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const preactPlugin: Plugin = {
  name: 'preact-plugin',
  setup({ onResolve }) {
    onResolve({ filter: /^p?react((-dom)|(\/.*))?$/ }, (args) => {
      return {
        // path: `/public/vendor/preact.min.js`,
        path: path.resolve(__dirname, `../../../public/vendor/preact.min.js`),
        // path: 'preact/compat',
        // namespace: 'ns-preact',
        // external: true
      }
    });
  },
};

export const messageBusPlugin: Plugin = {
  name: 'messagebus-plugin',
  setup({ onResolve }) {
    onResolve({ filter: /^@franklin-figma\/messages$/ }, (args) => {
      return {
        path: `/public/vendor/MessageBus.min.js`,
        namespace: 'ns-messagebus',
        external: true
      }
    });
  },
};