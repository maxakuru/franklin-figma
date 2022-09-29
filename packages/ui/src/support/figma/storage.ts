import MessageBus from "@franklin-figma/messages";
import type { AnyOk } from "../../types";

export function retrieve<T extends AnyOk>(key: string): Promise<T> {
  return MessageBus.execute((figma) => {
    return figma.clientStorage.getAsync(key);
  }, { key });
}

export function setOrRemove(key: string, value: AnyOk): Promise<void> {
  return MessageBus.execute((figma) => {
    return figma.clientStorage.setAsync(key, value);
  }, { key });
}