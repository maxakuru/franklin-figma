/// <reference path="../../../node_modules/@figma/plugin-typings/plugin-api.d.ts" />
/// <reference path="./exec-backend.ts" />

import { isPrivateMessage, serialize } from "./util";
import { exec } from './exec';

export type AnyFunc = (...args: any[]) => any;

export type OffFunction = () => void;
export type MessageType =
  | 'close'
  | 'selection:change'
  | 'currentpage:change'
  | 'ui:ready'
  | 'ui:init'
  | 'ui:change'
  | 'ui:close'
  | 'worker:ready'
  | 'worker:init'
  | 'drop:*';

/** @private */
export type PrivateMessageType = '__execute__' | '__api_backend__';

type AnyMessageType = MessageType | PrivateMessageType;

/** @private */
export interface BaseMessage<TMessageType extends AnyMessageType = AnyMessageType> {
  type: TMessageType;
  payload: Record<string, unknown> | undefined;
}

export type AnyPayloadMap = { [K in MessageType]: Record<string, unknown> | undefined; }

export interface PayloadMap extends AnyPayloadMap {
  'selection:change': {
    nodes: SceneNode[];
  };

  'currentpage:change': any;

  'close': any;

  'ui:ready': undefined;
  'ui:init': {
    uiType: 'config';
    nodeType: 'PAGE' | 'FORM';
    nodeId: string;
  } | {
    uiType: 'settings';
    nodeType?: 'PAGE' | 'FORM';
    nodeId?: string;
    panels?: ('node' | 'document' | 'global' | 'user')[];
  } | {
    uiType: 'editor';
    nodeId?: string;
  } | {
    uiType: 'menu';
  }
  'ui:change': {
    viewType: 'settings' | 'config' | 'editor' | 'menu' | 'wizard';
  };
  'ui:close': undefined;

  'worker:ready': undefined;
  'worker:init': any;

  'drop:*': DropEvent & Record<string, unknown>;
}

/** @private */
type AnyPrivatePayloadMap = { [K in PrivateMessageType]: Record<string, unknown> | undefined; }

export type MessageHandler<T extends MessageType> = (payload: PayloadMap[T]) => void | Promise<void>
export type AllMessagesHandler = <T extends MessageType>(type: T, payload: PayloadMap[T]) => void | Promise<void>

export type Context = PluginAPI;

export interface RemoteAPI {
  backend: {
    test: (foo: number) => Promise<void>;
    nodeToHTML: (nodeId: string) => Promise<{ html: string; images: Record<string, Uint8Array> }>;
    toast: (message: string, error?: boolean, timeout?: number) => void;
  }
}

/** @private */
interface PrivatePayloadMap extends AnyPrivatePayloadMap, PayloadMap {
  __execute__: {
    id: number;
    fn?: string;
    args?: string;
  } | {
    id: number;
    ret?: any;
  } | {
    id: number;
    error?: any;
  };

  __api_backend__: {
    id: number;
    fn?: string;
    args?: string;
  } | {
    id: number;
    ret?: any;
  } | {
    id: number;
    error?: any;
  }
}

/** @private */
export type MaybeOptionalPayloadFn<T extends MessageType> = PayloadMap[T] extends undefined
  ? (payload?: undefined) => void
  : (payload: PayloadMap[T]) => void;

const dev = globalThis.DEV;
const frontend = globalThis.UI || globalThis.WIDGET || typeof figma === 'undefined';
const figmaHost = 'https://www.figma.com';

class MessageBus {
  #frontend: boolean;
  #handlers: Record<MessageType, MessageHandler<any>[]> = {
    "selection:change": [],
    "currentpage:change": [],
    "close": [],
    "ui:ready": [],
    "ui:init": [],
    "ui:change": [],
    "ui:close": [],
    "worker:ready": [],
    "worker:init": [],
    "drop:*": []
  };
  #wildcardHandlers: AllMessagesHandler[] = [];
  #execId: number = 0;
  #execPromises: Record<number, [Promise<any>, (ret: any) => void, (rej: any) => void]> = {};

  constructor() {
    this.#frontend = frontend;
    this._connect();
  }

  public get isFrontend(): boolean {
    return this.#frontend;
  }

  public get isBackend(): boolean {
    return !this.#frontend;
  }

  private _connect() {
    if (this.#frontend) {
      window.addEventListener('message', this._incomingFrontend.bind(this));
    } else {
      figma.ui.onmessage = this._incomingBackend.bind(this);
    }
  }

  /**
   * Handle an incoming internal message on the backend.
   */
  private async _incomingBackendInternal(message: BaseMessage<PrivateMessageType>): Promise<void> {
    const { type } = message as BaseMessage<typeof message.type>;
    const { payload } = message as BaseMessage & { payload: PrivatePayloadMap[typeof type] };
    if (type === '__execute__' || type.startsWith('__api_')) {
      const { id, fn, args: argStr } = payload;
      const args = typeof argStr === 'object' ? argStr : argStr ? JSON.parse(argStr as string) : {};
      console.log(`[MessageBus] _incomingBackendInternal(${type}) id=${id}`);

      if (fn) {
        // request

        if (type === '__execute__') {
          // execute
          const scopeFn = new Function('figma', ...Object.keys(args), `return (${fn})(figma);`);
          const evalFn = `(${scopeFn}).call(null, figma, ...${JSON.stringify(Object.values(args))});`;

          exec(evalFn).then(ret => {
            this._sendExecute({ id, ret: serialize(ret) });
          }).catch((error) => {
            this._sendExecute({ id, error });
          });
        } else {
          // global API
          try {
            const ret = await ((globalThis as any).api[fn as string] as Function).apply(null, args);
            this._sendAPI('backend', { id, ret: serialize(ret) });
          } catch (error) {
            console.error('[MessageBus]  _incomingBackendInternal() global api error: ', error);
            this._sendAPI('backend', { id, error });
          }
        }
      } else {
        // response
        const { ret, error } = payload;
        const [_, resolve, reject] = this.#execPromises[id];
        if (error) {
          reject(error);
        } else {
          resolve(ret);
        }
        delete this.#execPromises[id];
      }
    }
  }

  /**
   * Handle an incoming message on the backend.
   */
  private _incomingBackend(message: BaseMessage, props?: OnMessageProperties) {
    // console.log('[MessageBus] _incomingBackend: ', message, props);
    if (isPrivateMessage(message)) {
      this._incomingBackendInternal(message);
    } else {
      this._incoming(message as BaseMessage<MessageType>);
    }
  }

  /**
   * Handle an incoming internal message on the frontend.
   */
  private _incomingFrontendInternal(message: BaseMessage<PrivateMessageType>): void {
    const { type } = message as BaseMessage<typeof message.type>;
    const { payload } = message as BaseMessage & { payload: PrivatePayloadMap[typeof type] };

    if (type === '__execute__' || type.startsWith('__api_')) {
      const { id, fn, args: argStr } = payload;
      const args = typeof argStr === 'object' ? argStr : argStr ? JSON.parse(argStr as string) : {};
      console.log(`[MessageBus] _incomingFrontendInternal(${args}) id=${id}`);

      if (fn) {
        // request
        // NOTE: scope/signature is different
        const scopeFn = new Function('window', ...Object.keys(args), `return (${fn})(window);`);
        const evalFn = `(${scopeFn}).call(null, window, ...${JSON.stringify(Object.values(args))});`;
        exec(evalFn).then(ret => {
          this._sendExecute({ id, ret: serialize(ret) });
        }).catch((error) => {
          this._sendExecute({ id, error });
        });
      } else {
        // response
        const { ret, error } = payload;
        const [_, resolve, reject] = this.#execPromises[id];
        if (error) {
          reject(error);
        } else {
          resolve(ret);
        }
        delete this.#execPromises[id];
      }

    }
  }

  /**
   * Handle an incoming message on the frontend.
   */
  private _incomingFrontend({ data }: { data: { pluginMessage: BaseMessage; } }) {
    // console.log('[MessageBus] _incomingFrontend() data: ', data);
    const { pluginMessage: message } = data;
    const { figmaMessage } = data as any;
    if (figmaMessage) {
      // TODO: handle system messages
      console.debug('[MessageBus] unhandled figmaMessage: ', figmaMessage);
    } else {
      if (isPrivateMessage(message)) {
        this._incomingFrontendInternal(message);
      } else {
        this._incoming(message as BaseMessage<MessageType>);
      }
    }
  }

  /**
   * Common incoming message for public messages to be forwarded to listeners.
   */
  private _incoming(message: BaseMessage<MessageType>) {
    // console.log('[MessageBus] _incoming() message: ', message);
    if (!message.type) {
      console.error('[MessageBus] Invalid message: ', message);
      return;
    }

    const handlers = this.#handlers[message.type];
    if (!handlers) {
      return;
    }

    handlers.forEach((h) => {
      if (!h) return;
      h.call(null, message.payload);
    })

    this.#wildcardHandlers.forEach((h) => {
      if (!h) return;
      h.call(null, message.type, message.payload);
    })
  }

  private _sendExecute(payload: PrivatePayloadMap['__execute__']) {
    this._send('__execute__', payload);
  }

  private _sendAPI(srcTgt: 'backend', payload: PrivatePayloadMap['__api_backend__']) {
    this._send(`__api_${srcTgt}__`, payload);
  }

  /**
   * Execute some function on the backend.
   * 
   * @param fn function to be executed
   * @param args additional args (named) to add to the scope of execution
   * @returns promise resolving to whatever is returned from the exec fn
   */
  execute<
    TFunc extends ExecFunc,
    TRet = ReturnType<TFunc>
  >(fn: TFunc, args?: Record<string, unknown>): Promise<TRet> {
    const id = this.#execId++;
    console.log(`[MessageBus] execute(${args}) id='${id}'`);

    let res, rej;
    const prom = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    this.#execPromises[id] = [prom, res, rej];

    this._sendExecute({
      id,
      fn: fn.toString(),
      args: args ? JSON.stringify(args) : undefined
    });
    return prom as Promise<TRet>;
  }

  private _api: RemoteAPI = {
    backend: new Proxy({}, {
      get: (target, fn, recv) => {
        return async (...args: any[]) => {
          const id = this.#execId++;
          console.log(`[MessageBus] _api(${args}) id='${id}'`);

          let res, rej;
          const prom = new Promise((resolve, reject) => {
            res = resolve;
            rej = reject;
          });
          this.#execPromises[id] = [prom, res, rej];

          this._sendAPI('backend', {
            id,
            fn: fn as string,
            args: args ? JSON.stringify(args) : undefined
          });
          return prom;
        }
      }
    })
  } as RemoteAPI;

  get api(): RemoteAPI {
    const api = this._api;
    const banned = this.#frontend ? 'frontend' : 'backend';
    try {
      Object.defineProperty(api, banned, {
        get: () => {
          throw Error(`cannot access ${banned} API from ${banned}`);
        }
      });
    } catch { /** noop */ }

    return api;
  }

  /**
   * Send a message to the other "side".
   */
  send<T extends MessageType, TPayload extends AnyFunc = MaybeOptionalPayloadFn<T>>(type: T, ...args: Parameters<TPayload>): void;
  send<T extends MessageType>(type: T, payload: PayloadMap[T]) {
    this._send(type, payload);
  }

  /**
   * Send a message to the other "side" 
   * and call all listeners for that type on current "side".
   */
  sendAll<T extends MessageType, TPayload extends AnyFunc = MaybeOptionalPayloadFn<T>>(type: T, ...args: Parameters<TPayload>): void;
  sendAll<T extends MessageType>(type: T, payload: PayloadMap[T]) {
    this._send(type, payload);
    if (this.#frontend) {
      this._incomingFrontend({ data: { pluginMessage: { type, payload } } });
    } else {
      this._incomingBackend({ type, payload });
    }
  }

  private _send<T extends MessageType | PrivateMessageType>(type: T, payload: PrivatePayloadMap[T]) {
    try {
      if (this.#frontend) {
        console.log(`[MessageBus] _send(frontend) type='${type}'`);
        parent.postMessage({
          pluginMessage: { type, payload },
          pluginId: globalThis.PLUGIN_ID
        }, dev ? '*' : figmaHost);
      } else {
        console.log(`[MessageBus] _send(backend) type='${type}'`);
        figma.ui.postMessage({ type, payload }, { origin: dev ? '*' : globalThis.UI_ENDPOINT });
      }
    } catch (e) {
      if (typeof e === 'object' && typeof (e as any).message === 'string' && (e as any).message.includes('No UI to send a message to')) {
        console.error('[MessageBus] Error, UI is closed during send: ', this.#frontend);
        this._incomingBackend({ type: 'ui:close', payload: undefined }, undefined);
      } else {
        console.error('[MessageBus] Error sending message: ', e);
      }
    }
  }

  /**
   * Set a handler that removes itself after one call.
   */
  once<T extends MessageType>(type: T, handler: MessageHandler<T>): void {
    let off: OffFunction;
    const wrap = (payload: PayloadMap[T]) => {
      handler.call(null, payload);
      off();
    }
    off = this.on(type, wrap);
  }

  /**
   * Add a message listener
   */
  on(type: '*', handler: AllMessagesHandler): OffFunction;
  on<T extends MessageType>(type: T, handler: MessageHandler<T>): OffFunction;
  on<
    T extends MessageType | '*',
    THandler = T extends MessageType ? MessageHandler<T> : AllMessagesHandler
  >(type: T, handler: THandler): OffFunction {
    let handlers: THandler[];
    if (type === '*') {
      handlers = this.#wildcardHandlers as THandler[];
    } else {
      handlers = this.#handlers[type as MessageType] as THandler[];
    }

    if (!handlers) return () => undefined;

    const index = handlers.push(handler);
    return () => {
      handlers[index - 1] = undefined;
    }
  }
}

export default new MessageBus();