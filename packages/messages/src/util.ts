import type { BaseMessage, PrivateMessageType } from "./MessageBus";

export function serialize<T>(o: T): T {
  if (typeof o !== 'object' || o === null) {
    return o;
  }

  if (Array.isArray(o)) {
    return o.map(serialize) as T;
  }

  const proto = Object.getPrototypeOf(o);
  const protoCopy = Object.keys(proto).reduce((prev, current) => {
    try {
      prev[current] = (o as typeof proto)[current];
    } catch (e) {
      console.error('[messages/util] serialize() error: ', e);
    }
    return prev;
  }, {} as Record<string, unknown>);

  return {
    ...protoCopy,
    ...o,
  }

}


export function isPrivateMessage(message: BaseMessage): message is BaseMessage<PrivateMessageType> {
  return message.type.startsWith('__') && message.type.endsWith('__');
}