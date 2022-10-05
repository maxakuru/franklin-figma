import type { Plugin } from 'esbuild';

export const preactPlugin: Plugin = {
  name: 'preact-plugin',
  setup({ onResolve }) {
    onResolve({ filter: /^preact(\/.*)?$/ }, (args) => {
      return {
        path: `/public/vendor/preact.min.js`,
        namespace: 'ns-preact',
        external: true
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