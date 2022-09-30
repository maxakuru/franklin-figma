/// <reference path="../../../../node_modules/@figma/plugin-typings/index.d.ts" />
/// <reference path="../../../../node_modules/@franklin-figma/messages/exec-ui.d.ts" />

import MessageBus from "@franklin-figma/messages";

/**
 * Spawn a worker in a UI thread to execute some function
 */
export function spawn<
  TFunc extends (this: null, ctx: Window, ...args: any[]) => any,
>(fn: TFunc, args?: Record<string, unknown>): Promise<ReturnType<TFunc>> {
  figma.showUI(__uiFiles__['worker'], { visible: false });

  return new Promise((resolve, reject) => {
    MessageBus.once('worker:ready', () => {
      MessageBus.execute(fn, args).then((val) => {
        resolve(val);
      }).catch(e => {
        reject(e);
      })
    });
  });
}