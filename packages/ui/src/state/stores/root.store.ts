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

import {
  makeObservable,
  observable,
  action,
  runInAction,
} from 'mobx';
import { ViewId } from '../../views/ids';
import { WizardId } from '../../views/Wizard';
import { AnyOk } from '../../types/util';
import { AuthStore } from './auth.store';
import { SelectionStore } from './selection.store';
import { SettingsStore } from './settings.store';
import MessageBus, { PayloadMap } from '@franklin-figma/messages';
import { VNode } from 'preact';

const INIT_VIEW: ViewId = ViewId.Wizard;
const INIT_WIZARD: WizardId = WizardId.setupLibrary;

class _RootStore {
  ready = false;
  authStore: AuthStore = undefined;
  selectionStore: SelectionStore = undefined;
  settingsStore: SettingsStore = undefined;

  viewType: ViewId = INIT_VIEW;
  _prevViewType: ViewId = undefined;
  nodeType?: 'FORM' | 'PAGE' = undefined;
  nodeId?: string = undefined;
  viewReady: boolean = false;
  wizardId: WizardId | undefined = INIT_WIZARD;

  initPayload: PayloadMap['ui:init'] = undefined;

  theme: 'light' | 'dark' = undefined;

  overlayStack: VNode[] = [];

  /**
   * Promise that resolves when initialization is complete
   */
  private _initPromise: Promise<void>;

  constructor() {
    console.log('[ui/stores/root] constructor');

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
      wizardId: observable,

      _init: action,
      reset: action,
      setNodeId: action,
      setNodeType: action,
      setViewType: action,
      setViewReady: action,
      setInitPayload: action,
      setTheme: action,
      pushOverlay: action,
      openWizard: action,
      closeWizard: action
    });

    this._initPromise = this._init();
  }

  get whenReady(): Promise<void> {
    return this._initPromise;
  }

  openWizard(id: WizardId) {
    if (!this._prevViewType) {
      this._prevViewType = this.viewType;
    }
    this.viewType = ViewId.Wizard;
    this.wizardId = id;
  }

  closeWizard() {
    this.viewType = this._prevViewType;
    this._prevViewType = undefined;
    this.wizardId = undefined;
    if (!this.viewType) {
      MessageBus.execute((figma) => {
        figma.closePlugin();
      });
    }
  }

  pushOverlay(overlay: VNode) {
    this.overlayStack.push(overlay);
  }

  popOverlay() {
    this.overlayStack.pop();
  }

  setTheme(theme: 'dark' | 'light') {
    console.log(`[ui/stores/root] setTheme(${theme})`);

    this.theme = theme;
  }

  setNodeId(id: string) {
    console.log(`[ui/stores/root] setNodeId(${id})`);
    this.nodeId = id;
  }

  setNodeType(type: 'PAGE' | 'FORM') {
    console.log(`[ui/stores/root] setNodeType(${type})`);
    this.nodeType = type;
  }

  setViewType(type: ViewId) {
    console.log(`[ui/stores/root] setViewType(${type})`);
    if (this.viewType === type) {
      return;
    }
    this.viewType = type;
    MessageBus.send('ui:change', { viewType: type });
  }

  setViewReady(ready: boolean) {
    console.log(`[ui/stores/root] setViewReady(${ready})`);
    this.viewReady = ready;
  }

  setInitPayload(payload: PayloadMap['ui:init']) {
    console.log(`[ui/stores/root] setInitPayload(${payload})`);
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
      console.debug('[ui/stores/root] ready!');
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
