/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type * as React from 'react';
import {
  makeObservable,
  observable,
  action,
  runInAction,
} from 'mobx';
import type { ViewId } from '../../views/ids';
import { AnyOk } from '../../types/util';
import { AuthStore } from './auth.store';
import { SelectionStore } from './selection.store';
import { SettingsStore } from './settings.store';
import { PayloadMap } from '@franklin-figma/messages';

class _RootStore {
  ready = false;
  authStore: AuthStore = undefined;
  selectionStore: SelectionStore = undefined;
  settingsStore: SettingsStore = undefined;

  viewType: ViewId = undefined;
  nodeType?: 'FORM' | 'PAGE' = undefined;
  nodeId?: string = undefined;
  viewReady: boolean = false;

  initPayload: PayloadMap['ui:init'] = undefined;

  theme: 'light' | 'dark' = undefined;

  overlayStack: React.ReactElement[] = [];

  /**
   * Promise that resolves when initialization is complete
   */
  private _initPromise: Promise<void>;

  constructor() {
    this.authStore = new AuthStore(this);
    this.selectionStore = new SelectionStore(this);
    this.settingsStore = new SettingsStore(this);

    makeObservable(this, {
      ready: observable,
      viewType: observable,
      nodeType: observable,
      nodeId: observable,
      viewReady: observable,
      initPayload: observable,
      theme: observable,
      overlayStack: observable,

      _init: action,
      reset: action,
      setNodeId: action,
      setNodeType: action,
      setViewType: action,
      setViewReady: action,
      setInitPayload: action,
      setTheme: action,
      pushOverlay: action
    });

    this._initPromise = this._init();
  }

  get whenReady(): Promise<void> {
    return this._initPromise;
  }

  pushOverlay(overlay: React.ReactElement) {
    this.overlayStack.push(overlay);
  }

  popOverlay() {
    this.overlayStack.pop();
  }

  setTheme(theme: 'dark' | 'light') {
    this.theme = theme;
  }

  setNodeId(id: string) {
    this.nodeId = id;
  }

  setNodeType(type: 'PAGE' | 'FORM') {
    this.nodeType = type;
  }

  setViewType(type: ViewId) {
    this.viewType = type;
  }

  setViewReady(ready: boolean) {
    this.viewReady = ready;
  }

  setInitPayload(payload: PayloadMap['ui:init']) {
    this.initPayload = payload;
  }

  /**
   * Set initial state from storage
   */
  async _init(): Promise<void> {
    await Promise.all([
      this.authStore.init(),
      this.selectionStore.init(),
      this.settingsStore.init()
    ]);

    runInAction(() => {
      console.debug('[RootStore] ready!');
      this.ready = true;
    });
  }

  async reset(): Promise<void> {
    await Promise.all([
      this.authStore.reset(),
      this.selectionStore.reset(),
      this.settingsStore.reset()
    ]);
  }
}

export type RootStore = _RootStore;
const root = new _RootStore();
(window as AnyOk).store = root; // for dev debugging
export default root;
