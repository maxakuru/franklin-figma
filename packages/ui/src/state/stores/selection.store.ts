import MessageBus from '@franklin-figma/messages';
import {
  makeObservable,
  observable,
  action,
  runInAction,
  computed,
} from 'mobx';
import { findAncestor } from '../../util';
import { BaseStore } from './BaseStore';
import type { RootStore } from './root.store';

export class SelectionStore extends BaseStore {
  enabled: boolean = false;
  nodes: SceneNode[] = [];

  constructor(root: RootStore) {
    super(root);

    makeObservable(this, {
      nodes: observable,
      enabled: observable,
      nodesUnderRoot: computed,
      setNodes: action,
      enable: action,
    });
  }

  async enable() {
    if (this.enabled) {
      return;
    }

    this.enabled = true;
    const selectedNodes = await MessageBus.execute((figma) => {
      return figma.currentPage.selection;
    });

    console.log('[stores/selection] enabled: ', selectedNodes);
    this.setNodes(selectedNodes as SceneNode[]);

    this.discard(
      MessageBus.on('selection:change', ({ nodes }) => {
        this.setNodes(nodes);
      })
    );
  }

  get nodesUnderRoot(): SceneNode[] {
    if (!this.root.nodeId) {
      return this.nodes;
    }
    return this.nodes.filter((node) => !!findAncestor(node, (parent => parent.id === this.root.nodeId)));
  }

  setNodes(nodes: SceneNode[]) {
    this.nodes = nodes;
  }

  /**
   * Set initial state
   */
  onInit() {
    console.debug('[SelectionStore] ready!');
  }

  /**
   * Reset state
   */
  onReset() {
    this.nodes = [];
    this.enabled = false;
  }
}
