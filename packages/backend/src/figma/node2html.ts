type BaseNodeWithType<T extends BaseNode['type']> = Extract<BaseNode, { type: T }>;

type MaybePromise<R> = R | Promise<R>;

type ReturnDirective = 'SKIP' | 'CONTINUE';

interface Context {
  _libraryBlocks: Record<string, string>;
  _libraryDefinition: Record<string, string>[];

  // the composed document
  doc: string;

  // ordered wrappers for elements that contain children
  wrappers: [pre: string, post: string][];

  // image hash -> byte array
  images: Record<string, Uint8Array>;

  getLibraryBlock(name: string): Promise<string | undefined>;
}

type Visitor<TNode extends BaseNode = BaseNode> = (node: TNode, ctx: Context) => MaybePromise<string | void | [string, string] | ReturnDirective>;

type Visitors = {
  [T in BaseNode['type']]: Visitor<BaseNodeWithType<T>>;
} & {
  // convenience visitors, not node type based
  __IMAGE: Visitor<RectangleNode>
}

const visitors: Visitors = {
  __IMAGE: async (node, ctx) => {
    console.log('__IMAGE: ', node);
    if (!Array.isArray(node.fills)) return;

    const imageFill = node.fills.find(fill => fill.visible && fill.opacity > 0 && fill.type === 'IMAGE');
    const image = figma.getImageByHash(imageFill.imageHash);
    const bytes = await image.getBytesAsync();
    ctx.images[image.hash] = bytes;
    return `<img src="hash://${image.hash}">`;
  },
  DOCUMENT: (node) => {

  },
  PAGE: (node) => {

  },
  SLICE: (node) => {

  },
  FRAME: (node) => { },
  GROUP: () => { },
  COMPONENT_SET: () => { },
  async COMPONENT(node, ctx) {
    const block = await ctx.getLibraryBlock(node.name);
    console.log('COMPONENT block: ', block);
    return '';
  },
  async INSTANCE(node, ctx) {
    const block = await ctx.getLibraryBlock(node.name);
    console.log('INSTANCE block: ', block, node.name);
    return '';
  },
  BOOLEAN_OPERATION: () => { },
  VECTOR: () => { },
  STAR: () => { },
  LINE: () => { },
  ELLIPSE: () => { },
  POLYGON: () => { },
  RECTANGLE: () => {
    return 'SKIP';
  },
  TEXT: (node) => {
    return `<p>${node.characters}</p>`
  },
  STICKY: () => { },
  CONNECTOR: () => { },
  SHAPE_WITH_TEXT: () => { },
  CODE_BLOCK: (node) => {
    return `<pre><code>${node.code}</pre></code>`;
  },
  STAMP: () => { },
  WIDGET: () => {
    return 'SKIP';
  },
  EMBED: () => { },
  LINK_UNFURL: () => { },
  MEDIA: () => { },
  SECTION: () => { },
  HIGHLIGHT: () => { },
  WASHI_TAPE: () => { },
  TABLE: () => { },
}

const _nodeToHTML = async (node: BaseNode, ctx: Context): Promise<string> => {
  if ((node as SceneNode).visible === false) {
    return 'SKIP';
  }

  let type: keyof Visitors = node.type;
  if (node.isAsset && (node as RectangleNode).fills) {
    const rectLike = node as RectangleNode;
    if (
      Array.isArray(rectLike.fills)
      && rectLike.fills.length
      && rectLike.fills.some(fill => fill.visible && fill.opacity > 0 && fill.type === 'IMAGE')
    ) {
      type = '__IMAGE';
    }
  }
  console.log('node type: ', type, node);

  const visitor = (
    visitors[type] || (() => console.warn('[backend/node2html] node type not handled: ', type, node))
  ) as Visitor;

  const ret = await visitor(node, ctx);
  console.log('ret: ', ret);
  if (ret === 'SKIP') {
    return;
  }

  let wrapped = false;
  if (typeof ret === 'string') {
    ctx.doc += ret;
  } else if (Array.isArray(ret)) {
    wrapped = true;
    ctx.doc += ret[0];
    ctx.wrappers.push(ret);
  }

  if ((node as GroupNode).children) {
    for (const child of (node as GroupNode).children) {
      await _nodeToHTML(child, ctx);
    }
  }

  if (ctx.wrappers.length) {
    const outer = ctx.wrappers.pop();
    ctx.doc += outer[1];
  }
}

export default async function nodeToHTML(nodeId: string): Promise<{ html: string; images: Record<string, Uint8Array> }> {
  const node = figma.getNodeById(nodeId);
  if (!node) {
    return { html: '', images: {} };
  }

  const _libraryDefinition = (await figma.clientStorage.getAsync('library_data'))?.definition || [];

  const ctx: Context = {
    _libraryBlocks: {},
    _libraryDefinition,
    doc: '',
    wrappers: [],
    images: {},
    async getLibraryBlock(this: Context, name: string) {
      if (typeof this._libraryBlocks[name] === 'string') {
        return this._libraryBlocks[name];
      }

      const row = this._libraryDefinition.find(row => row.name === name);
      if (!row || !row.path) return;

      const resp = await fetch(row.path);
      if (!resp.ok) {
        this._libraryBlocks[name] = '';
      } else {
        this._libraryBlocks[name] = await resp.text();
      }
      await figma.clientStorage.setAsync('library_blocks', this._libraryBlocks);

      return this._libraryBlocks[name];
    }
  }
  await _nodeToHTML(node, ctx);

  return {
    html: ctx.doc,
    images: ctx.images
  }
}