import {
  makeObservable,
  observable,
  action,
  computed,
} from 'mobx';
import { BaseStore } from './BaseStore';
import type { RootStore } from './root.store';
import { PanelId } from '../../views/Settings/panels';
import { retrieve, setOrRemove } from '../../support/figma';
import { AnyOk } from 'src/types';


export class SettingsStore extends BaseStore {
  enabled: boolean = false;
  panelId: string = undefined;

  // library data
  libraryURL: string | undefined = undefined;
  libraryBlocks: AnyOk = undefined;

  constructor(root: RootStore) {
    super(root);

    makeObservable(this, {
      enabled: observable,
      panelId: observable,
      libraryURL: observable,
      nodePanelEnabled: computed,
      enabledPanels: computed,
      enable: action,
      setPanelId: action,
      setLibraryData: action
    });
  }

  async setLibraryData(url: string, blocks: AnyOk) {
    this.libraryURL = url;
    this.libraryBlocks = blocks;

    await setOrRemove('library_data', { url, blocks });
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
  async onInit() {
    console.info('[ui/stores/settings] onInit()');
    const data = await retrieve<AnyOk>('library_data');

    if (data) {
      const { url, blocks } = data;
      this.libraryBlocks = blocks;
      this.libraryURL = url;
    }
  }

  /**
   * Reset state
   */
  onReset() {
    this.enabled = false;
  }
}
