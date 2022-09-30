/// <reference path="../../../../node_modules/@figma/plugin-typings/plugin-api.d.ts" />

import './setup';
import MessageBus from '@franklin-figma/messages';

(async () => {
  MessageBus.send('worker:ready');
})();