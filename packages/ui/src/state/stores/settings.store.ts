import MessageBus from '@franklin-figma/messages';
import {
  makeObservable,
  observable,
  action,
  computed,
} from 'mobx';
import { BaseStore } from './BaseStore';
import type { RootStore } from './root.store';
import { PanelId } from '../../views/Settings/panels';

export class SettingsStore extends BaseStore {
  enabled: boolean = false;
  panelIndex: number = undefined;

  constructor(root: RootStore) {
    super(root);

    makeObservable(this, {
      enabled: observable,
      panelIndex: observable,
      nodePanelEnabled: computed,
      enable: action,
      setPanelIndex: action
    });
  }

  setPanelIndex(index: number) {
    this.panelIndex = index;
  }

  get nodePanelEnabled() {
    return !!this.root.nodeId;
  }

  async enable() {
    if (this.enabled) {
      return;
    }

    this.enabled = true;
    // TODO: pull settings from plugindata
    // const selectedNodes = await MessageBus.execute((figma) => {
    //   return figma.currentPage.selection;
    // });

    if (this.nodePanelEnabled) {
      this.setPanelIndex(PanelId.Node);
    } else {
      this.setPanelIndex(PanelId.Document);
    }
  }

  /**
   * Set initial state
   */
  onInit() {
    console.debug('[SettingsStore] ready!');
  }

  /**
   * Reset state
   */
  onReset() {
    this.enabled = false;
  }
}
