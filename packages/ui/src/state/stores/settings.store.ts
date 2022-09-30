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
  panelId: string = undefined;

  constructor(root: RootStore) {
    super(root);

    makeObservable(this, {
      enabled: observable,
      panelId: observable,
      nodePanelEnabled: computed,
      enabledPanels: computed,
      enable: action,
      setPanelId: action
    });
  }

  setPanelId(id: string) {
    this.panelId = id;
  }

  get nodePanelEnabled() {
    return !!this.root.nodeId;
  }

  get enabledPanels() {
    if (typeof (this.root.initPayload as Record<string, unknown>).panels === 'undefined') {
      const enabled = ['document', 'global', 'user'];
      if (this.nodePanelEnabled) {
        enabled.push('node');
      }
      return enabled;
    }
    return (this.root.initPayload as unknown as Record<string, string[]>).panels;
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

    // prioritized panels
    const enabled = this.enabledPanels;
    if (enabled.includes('node')) {
      this.setPanelId(PanelId.Node);
    } else if (enabled.includes('document')) {
      this.setPanelId(PanelId.Document);
    } else if (enabled.includes('user')) {
      this.setPanelId(PanelId.User);
    } else if (enabled.includes('global')) {
      this.setPanelId(PanelId.Global);
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
