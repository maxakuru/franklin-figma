/// <reference path="../../../node_modules/@figma/plugin-typings/plugin-api.d.ts" />

import { isPrivateMessage, serialize } from "./util";

const geval = eval;

export type AnyFunc = (...args: any[]) => any;

export type OffFunction = () => void;
export type MessageType =
  | 'test'
  | 'close'
  | 'selection:change'
  | 'currentpage:change'
  | 'ui:ready'
  | 'ui:init'
  | 'ui:close';

/** @private */
export type PrivateMessageType = '__execute__';

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
  };
  'ui:close': {
    uiType: 'config';
    nodeType: 'PAGE' | 'FORM';
    nodeId: string;
  };
}

/** @private */
type AnyPrivatePayloadMap = { [K in PrivateMessageType]: Record<string, unknown> | undefined; }

export type MessageHandler<T extends MessageType> = (payload: PayloadMap[T]) => void | Promise<void>
export type AllMessagesHandler = <T extends MessageType>(type: T, payload: PayloadMap[T]) => void | Promise<void>

export type Context = PluginAPI;

export type ExecFunc = (this: null, figma: Context, ...args: any[]) => any;

/** @private */
interface PrivatePayloadMap extends AnyPrivatePayloadMap, PayloadMap {
  __execute__: {
    id: number;
    fn?: string;
    args?: Record<string, unknown>;
  } | {
    id: number;
    ret?: any;
  } | {
    id: number;
    error?: any;
  }
}

/** @private */
type MaybeOptionalPayloadFn<T extends MessageType> = PayloadMap[T] extends undefined
  ? (type: T, payload?: undefined) => void
  : (type: T, payload?: PayloadMap[T]) => void;

const dev = globalThis.DEV;

class MessageBus {
  #frontend: boolean;
  #handlers: Record<MessageType, MessageHandler<any>[]> = {
    "test": [],
    "selection:change": [],
    "currentpage:change": [],
    "close": [],
    "ui:ready": [],
    "ui:init": [],
    "ui:close": []
  };
  #wildcardHandlers: AllMessagesHandler[] = [];
  #execId: number = 0;
  #execPromises: Record<number, [Promise<any>, (ret: any) => void, (rej: any) => void]> = {};

  constructor() {
    this.#frontend = globalThis.UI || globalThis.WIDGET;
    this._connect();
  }

  private _connect() {
    if (this.#frontend) {
      onmessage = this._incomingFrontend.bind(this);
    } else {
      figma.ui.onmessage = this._incomingBackend.bind(this);
    }
  }

  private _incomingBackend(message: BaseMessage, props: OnMessageProperties) {
    // console.log('[MessageBus] _incomingBackend: ', message, props);

    if (isPrivateMessage(message)) {
      const { type } = message as BaseMessage<typeof message.type>;
      const { payload } = message as BaseMessage & { payload: PrivatePayloadMap[typeof type] };
      if (type === '__execute__') {
        console.log('[MessageBus] _incomingBackend() execute: ', payload);
        const { id, fn, args = {} } = payload;
        const scopeFn = new Function('figma', ...Object.keys(args), `return (${fn})(figma);`);
        const evalFn = `(${scopeFn}).call(null, figma, ...${JSON.stringify(Object.values(args))});`;
        const evalRet = geval(evalFn);

        if (typeof evalRet === 'object' && typeof evalRet.then === 'function') {
          evalRet.then((ret: any) => {
            this._sendExecute({ id, ret: serialize(ret) });
          }).catch((error: any) => {
            this._sendExecute({ id, error });
          });
        } else {
          this._sendExecute({ id, ret: serialize(evalRet) });
        }

      }
    } else {
      this._incoming(message as BaseMessage<MessageType>);
    }
  }

  private _incomingFrontend({ data }: { data: { pluginMessage: BaseMessage } }) {
    // console.log('[MessageBus] _incomingFrontend() data: ', data);
    const { pluginMessage: message } = data;
    if (isPrivateMessage(message)) {
      if (message.type === '__execute__') {
        const { id, ret, error } = message.payload as { id: number; ret: any; error: any; };
        const [_, resolve, reject] = this.#execPromises[id];
        if (error) {
          reject(error);
        } else {
          resolve(ret);
        }
        delete this.#execPromises[id];
      }
    } else {
      this._incoming(message as BaseMessage<MessageType>);
    }
  }

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

  execute<
    TFunc extends ExecFunc,
    TRet = ReturnType<TFunc>
  >(fn: TFunc, args?: Record<string, unknown>): Promise<TRet> {
    if (!this.#frontend) {
      throw Error('Can only be done from UI');
    }

    const id = this.#execId++;
    this._sendExecute({ id, fn: fn.toString(), args });

    let res, rej;
    const prom = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    this.#execPromises[id] = [prom, res, rej];
    return prom as Promise<TRet>;
  }

  send<T extends MessageType, TPayload extends AnyFunc = MaybeOptionalPayloadFn<T>>(...args: Parameters<TPayload>): void;
  send<T extends MessageType>(type: T, payload: PayloadMap[T]) {
    this._send(type, payload);
  }

  private _send<T extends MessageType | PrivateMessageType>(type: T, payload: PrivatePayloadMap[T]) {
    if (this.#frontend) {
      parent.postMessage({ pluginMessage: { type, payload } }, dev ? '*' : '/');
    } else {
      figma.ui.postMessage({ type, payload }, { origin: dev ? '*' : '/' });
    }
  }

  once<T extends MessageType>(type: T, handler: MessageHandler<T>): void {
    let off: OffFunction;
    const wrap = (payload: PayloadMap[T]) => {
      handler.call(null, payload);
      off();
    }
    off = this.on(type, wrap);
  }

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