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
  } | {
    uiType: 'settings';
    nodeType?: 'PAGE' | 'FORM';
    nodeId?: string;
  };
  'ui:close': undefined;
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
export type MaybeOptionalPayloadFn<T extends MessageType> = PayloadMap[T] extends undefined
  ? (payload?: undefined) => void
  : (payload: PayloadMap[T]) => void;

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
    this.#frontend = globalThis.UI || globalThis.WIDGET || typeof figma === 'undefined';
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
      onmessage = this._incomingFrontend.bind(this);
    } else {
      figma.ui.onmessage = this._incomingBackend.bind(this);
    }
  }

  /**
   * Handle an incoming internal message on the backend.
   */
  private _incomingBackendInternal(message: BaseMessage<PrivateMessageType>): void {
    const { type } = message as BaseMessage<typeof message.type>;
    const { payload } = message as BaseMessage & { payload: PrivatePayloadMap[typeof type] };
    if (type === '__execute__') {
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
  }

  /**
   * Handle an incoming message on the frontend.
   */
  private _incomingFrontend({ data }: { data: { pluginMessage: BaseMessage } }) {
    // console.log('[MessageBus] _incomingFrontend() data: ', data);
    const { pluginMessage: message } = data;
    if (isPrivateMessage(message)) {
      this._incomingFrontendInternal(message);
    } else {
      this._incoming(message as BaseMessage<MessageType>);
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
        parent.postMessage({ pluginMessage: { type, payload } }, dev ? '*' : '/');
      } else {
        figma.ui.postMessage({ type, payload }, { origin: dev ? '*' : '/' });
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