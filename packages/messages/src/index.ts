/// <reference path="../../../node_modules/@figma/plugin-typings/plugin-api.d.ts" />

export type OffFunction = () => void;
export type MessageType = 'test';
export interface BaseMessage {
  type: MessageType;
  payload: Record<string, unknown>;
}
export type AnyMessageMap = { [K in MessageType]: BaseMessage; }
export interface MessageMap extends AnyMessageMap {
  'test': BaseMessage;
}
export type PayloadMap = {
  [K in keyof MessageMap]: MessageMap[K]['payload'];
}
export type MessageHandler<T extends MessageType> = (payload: PayloadMap[T]) => void | Promise<void>
export type AllMessagesHandler = <T extends MessageType>(type: T, payload: PayloadMap[T]) => void | Promise<void>

export type Context = PluginAPI;

class MessageBus {
  #frontend: boolean;
  #handlers: Record<MessageType, MessageHandler<any>[]> = {
    "test": []
  };
  #wildcardHandlers: AllMessagesHandler[] = [];
  #execId: number = 0;
  #execPromises: Record<number, [Promise<any>, (ret: any) => void, (rej: any) => void]> = {};

  constructor() {
    this.#frontend = globalThis.UI | globalThis.WIDGET;
    this._connect();
  }

  private _connect() {
    if (this.#frontend) {
      console.log('[MessageBus] _connect(ui)');

      onmessage = this._incomingFrontend.bind(this);
    } else {
      console.log('[MessageBus] _connect(backend)');

      figma.ui.onmessage = this._incomingBackend.bind(this);
    }
  }

  private _incomingBackend(message: BaseMessage, props: OnMessageProperties) {
    console.log('_incomingBackend: ', message, props);

    if (message.type as string === '__execute__') {
      console.log('[backend] execute: ', message.payload);
      const { id, fn } = message.payload as { id: number; fn: string };
      console.log('[backend] id, fn: ', id, fn);
      const evalRet = eval(`(${fn}).call(figma);`);

      if (typeof evalRet === 'object' && typeof evalRet.then === 'function') {
        evalRet.then((ret: any) => {
          console.log('[backend] promise ret: ', ret);
          this._sendExecute(id, { ret });
        }).catch((error: any) => {
          console.log('[backend] error: ', error);
          this._sendExecute(id, { error });
        });
      } else {
        console.log('[backend] ret: ', evalRet);
        this._sendExecute(id, { ret: evalRet });
      }

    } else {
      this._incoming(message);
    }
  }

  private _incomingFrontend({ data }: { data: { pluginMessage: BaseMessage } }) {
    console.log('_incomingFrontend: ', data);
    const { pluginMessage: message } = data;
    // const message = JSON.parse(pluginMessage as unknown as string);

    if (message.type as string === '__execute__') {
      const { id, ret, error } = message.payload;
      const [_, resolve, reject] = this.#execPromises[id as number];
      if (error) {
        reject(error);
      } else {
        resolve(ret);
      }
      delete this.#execPromises[id as number];
    } else {
      this._incoming(message);
    }
  }

  private _incoming(message: BaseMessage) {
    console.log('_incoming: ', message);
    if (!message.type) {
      console.error('Invalid message: ', message);
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

  private _sendExecute(id: number, { fn, ret, error }: { fn?: string, ret?: any, error?: any }) {
    this._send('__execute__', {
      id,
      fn,
      ret,
      error
    })
  }
  execute<
    T extends (this: Context) => any, TRet = ReturnType<T>
  >(fn: (
    this: Context,
    ...args: Parameters<T>
  ) => ReturnType<T>
  ): Promise<TRet> {
    if (!this.#frontend) {
      throw Error('Can only be done from UI');
    }

    const id = this.#execId++;
    this._sendExecute(id, { fn: fn.toString() });

    let res, rej;
    const prom = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    this.#execPromises[id] = [prom, res, rej];
    return prom as Promise<TRet>;
  }

  send<T extends MessageType>(type: T, payload: PayloadMap[T]) {
    this._send(type, payload);
  }

  private _send(type: string, payload: any) {
    if (this.#frontend) {
      console.log('[messages] _send(ui)');
      parent.postMessage({ pluginMessage: { type, payload } }, '*');
    } else {
      console.log('[messages] _send(backend)');
      figma.ui.postMessage({ type, payload }, { origin: '*' });
    }
  }

  on(type: '*', handler: AllMessagesHandler): OffFunction;
  on<T extends MessageType>(type: T, handler: MessageHandler<T>): OffFunction
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