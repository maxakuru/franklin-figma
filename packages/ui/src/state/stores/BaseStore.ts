import {
  makeObservable,
  observable,
  action,
  runInAction,
} from 'mobx';
import type { RootStore } from './root.store';

export abstract class BaseStore {
  ready = false;
  root: RootStore = undefined;
  private _discard: (() => void)[] = [];

  constructor(root: RootStore) {
    this.root = root;

    makeObservable(this, {
      ready: observable,
      onInit: action,
      onReset: action
    });
  }

  discard(fn: () => void) {
    this._discard.push(fn);
  }

  async init() {
    await this.onInit();
    runInAction(() => {
      this.ready = true;
    });
  }

  reset() {
    this._discard.forEach((h) => h && h.call(null));
    this._discard = [];
    return this.onReset();
  }

  /**
   * Set initial state
   */
  abstract onInit(): void | Promise<void>;

  /**
   * Reset state
   */
  abstract onReset(): void | Promise<void>;
}
