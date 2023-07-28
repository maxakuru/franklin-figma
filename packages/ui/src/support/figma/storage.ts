import MessageBus from "@franklin-figma/messages";
import type { AnyOk } from "../../types";

export function retrieve<T extends AnyOk>(key: string): Promise<T> {
  console.log(`[support/figma] retrieve(${key})`);

  return MessageBus.execute((figma) => {
    const data = figma.clientStorage.getAsync(key);
    console.log(`[support/figma] retrieved ${key} => ${data}`);
    return data;
  }, { key });
}

export function setOrRemove(key: string, value: AnyOk): Promise<void> {
  console.log(`[support/figma] setOrRemove(${key} => ${value})`);

  return MessageBus.execute((figma) => {
    if (typeof value === 'undefined') {
      return figma.clientStorage.deleteAsync(key);
    } else {
      return figma.clientStorage.setAsync(key, value);
    }
  }, { key, value });
}