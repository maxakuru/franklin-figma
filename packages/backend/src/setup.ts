/// <reference path="../../../node_modules/@types/node/index.d.ts" />

globalThis.UI_ENDPOINT = process.env.UI_ENDPOINT;
globalThis.PLUGIN_ID = process.env.PLUGIN_ID;
globalThis.DEV = process.env.DEV as unknown as boolean;