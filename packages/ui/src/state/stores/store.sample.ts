import {
  makeObservable,
  observable,
  action,
  runInAction,
} from 'mobx';
import { BaseStore } from './BaseStore';
import type { RootStore } from './root.store';

export class SampleStore_IGNORE extends BaseStore {
  foo?: string = undefined;

  constructor(root: RootStore) {
    super(root);

    makeObservable(this, {
      foo: observable,
      bar: action
    });

  }

  /**
   * Set initial state
   */
  async onInit(): Promise<void> {
    console.debug('[Store] ready!');
  }

  /**
   * Reset state
   */
  onReset(): void {
    this.foo = undefined;
  }

  bar() {
    console.log('baz');
  }
}
