import MessageBus from "@franklin-figma/messages";

type BaseNodeWithType<T extends BaseNode['type']> = Extract<BaseNode, { type: T }>;

type MaybePromise<R> = R | Promise<R>;

type ReturnDirective = 'SKIP' | 'CONTINUE';

interface Context {
  _libraryBlocks: Record<string, string>;
  _libraryDefinition: Record<string, string>[];
  _inSection: boolean;

  // the composed document
  doc: string;

  // ordered wrappers for elements that contain children
  wrappers: [pre: string, post: string, cb?: () => void][];

  // image hash -> byte array
  images: Record<string, Uint8Array>;

  getLibraryBlock(name: string): Promise<[html: string, block: string, variants: string[]] | undefined>;
}

type Visitor<TNode extends BaseNode = BaseNode> = (
  node: TNode,
  ctx: Context
) => MaybePromise<string | void | [string, string] | [string, string, () => MaybePromise<void>] | ReturnDirective>;

type Visitors = {
  [T in BaseNode['type']]: Visitor<BaseNodeWithType<T>>;
} & {
  // convenience visitors, not node type based
  __IMAGE: Visitor<RectangleNode>
}

type DOMNode = {
  selector: string;
  tag: string;
  classes: Set<string>;
  attrs: Record<string, string>;
  innerHTML?: string;
  innerText?: string;
  parent: DOMNode | null;
  children?: DOMNode[];
  linked: boolean;
}

type ParsedDOM = {
  root: DOMNode;
  find: (predicate: (node: DOMNode) => boolean, nonLinked?: boolean) => DOMNode | undefined;
  html: () => string;
}

const isImageNode = (node: BaseNode): boolean => {
  if (!node.isAsset || !(node as RectangleNode).fills) {
    return false;
  }
  const rectLike = node as RectangleNode;
  return (
    Array.isArray(rectLike.fills)
    && rectLike.fills.length
    && rectLike.fills.some(fill => fill.visible && fill.opacity > 0 && fill.type === 'IMAGE')
  );
}

const findAllAncestors = (root: BaseNode, predicate: (node: BaseNode) => boolean): BaseNode[] => {
  const all = [];
  if (predicate(root)) {
    all.push(root);
  }
  if (!(root as GroupNode).children) {
    return all;
  }
  return [
    ...all,
    ...(root as GroupNode).children.flatMap((child) => findAllAncestors(child, predicate))
  ]
}

const parseDOM = async (html: string, selector: string = ''): Promise<undefined | ParsedDOM> => {
  const root = await MessageBus.execute(() => {
    // @ts-ignore
    const div = document.createElement('div');
    div.innerHTML = html;

    const rootEl = selector ? div.querySelector(selector) : div.firstElementChild;
    if (!rootEl) {
      return;
    }

    // @ts-ignore
    const getSelector = (el: HTMLElement, ceiling: HTMLElement): string => {
      if (el.tagName.toLowerCase() == "html") {
        return "HTML";
      }
      let str = `${el.tagName}${(el.id != "") ? "#" + el.id : ""}`;
      if (el.className) {
        const classes = el.className.split(/\s+/);
        for (let i = 0; i < classes.length; i++) {
          str += "." + classes[i]
        }
      }
      if (!el.parentNode || el === ceiling) {
        return str;
      }
      if (el.parentNode.firstElementChild !== el) {
        const index = [...el.parentNode.children].findIndex(child => child === el);
        str += `:nth-child(${index})`;
      }
      return `${getSelector(el.parentNode, ceiling)} > ${str}`;
    }

    // @ts-ignore
    function parseNode(node: HTMLElement, root: HTMLElement): DOMNode {
      const parsed: DOMNode = {
        linked: false,
        selector: getSelector(node, root),
        tag: node.tagName,
        innerText: ['DIV'].includes(node.tagName) ? undefined : node.innerText,
        attrs: Object.fromEntries(Object.values(node.attributes).map((attr: any) => [attr.name, attr.value])),
        classes: node.className ? node.className.split(/\s+/) : [],
        children: [...node.children].map((child) => parseNode(child, root))
      } as DOMNode;

      // console.log('[backend/node2html] parsed node: ', node.tagName, node, parsed);
      return parsed;
    }

    return parseNode(rootEl, rootEl);
  }, { html, selector });

  // assign parent node to each
  const process = (node: DOMNode, parent: DOMNode | null) => {
    node.parent = parent;
    if (node.children) {
      node.children.forEach((child) => process(child, node));
    }
  }
  process(root, null);

  return {
    root,
    find(this: ParsedDOM, predicate: (node: DOMNode) => boolean) {
      const _find = (node: DOMNode, nonLinked: boolean = true): DOMNode => {
        if ((nonLinked ? !node.linked : true) && predicate(node)) return node;
        return node.children.reduce((prev, cur) => {
          if (prev) return prev;
          return _find(cur);
        }, null);
      }

      return _find(this.root);
    },
    html(this: ParsedDOM) {
      let out = '';
      let indent = 0;

      const _process = (node: DOMNode): string => {
        if (!node.linked) {
          // node not included in component
          return out;
        }

        const tag = node.tag.toLowerCase();

        out += `${out.match(/\s$/) ? '' : '\n'}${' '.repeat(indent)}<${tag}\
${node.classes.size ? ` class="${[...node.classes].join(' ')}"` : ''}\
${!Object.keys(node.attrs).length ? '' : ` ${Object.entries(node.attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}`}>`;

        indent += 1;
        out += `\n${' '.repeat(indent)}`;

        if (node.innerText && (!node.children || !node.children.length)) {
          // paragraph leaf with text
          out += node.innerText;
        }
        (node.children || []).forEach(_process);

        indent -= 1;
        // TODO: handle self closing tags
        if (!['img', 'source'].includes(tag)) {
          out += `\n${' '.repeat(indent)}</${tag}>`;
        }
        return out;
      };

      return _process(this.root);
    }
  }
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
  DOCUMENT: (node) => { },
  PAGE: (node) => { },
  SLICE: (node) => { },
  FRAME: (node) => { },
  GROUP: (_node, ctx) => {
    if (ctx._inSection) {
      return 'CONTINUE';
    }
    ctx._inSection = true;
    return ['<div>', '</div>', () => { ctx._inSection = false }];
  },
  COMPONENT_SET: () => { },
  async COMPONENT(node, ctx) {
    const block = await ctx.getLibraryBlock(node.name);
    console.log('COMPONENT block: ', node.name, block);
    if (!block) {
      return 'CONTINUE';
    }
    return 'SKIP';
  },
  async INSTANCE(node, ctx) {
    const [html, block] = await ctx.getLibraryBlock(node.name);
    console.log('INSTANCE block: ', node.name, block, html);
    if (!html) {
      return 'CONTINUE';
    }

    // find each insertable node in instance
    const insertableNodes = findAllAncestors(node, (candidate) => {
      if ((candidate as TextNode).visible === false) {
        return false;
      }
      if (isImageNode(candidate)) {
        return true;
      }
      return ['TEXT', 'CODE_BLOCK'].includes(candidate.type);
    });

    const dom = await parseDOM(html, `div.${block}`);
    console.log('dom, insertableNodes: ', dom, insertableNodes);

    const main = node.mainComponent;
    console.log('node, main: ', node, main);

    // for each insertable node,
    for (const insertable of insertableNodes) {
      // find corresponding node in main component: snip instance id from `I{instance.id};${main.id}`
      const mainNodeId = insertable.id.replace(new RegExp(`^I${node.id};`), 'I');
      const mainNode = figma.getNodeById(mainNodeId);

      // content of main component's node is what connects to block
      let match: DOMNode | undefined;
      if (isImageNode(mainNode)) {
        match = dom.find((cand) => cand.attrs.alt === mainNode.name);

        if (match) {
          const imageFill = (insertable as any).fills.find((fill: Paint) => fill.visible && fill.opacity > 0 && fill.type === 'IMAGE');
          const image = figma.getImageByHash(imageFill.imageHash);
          const bytes = await image.getBytesAsync();
          ctx.images[imageFill.imageHash] = bytes;
          match.attrs.src = `hash://${image.hash}`;
        } else {
          console.warn('[backend/node2html] no main component match found for image: ', mainNode.name, mainNode, insertable)
        }
      } else {
        switch (mainNode.type) {
          case 'TEXT':
            match = dom.find((cand) => (!cand.children || !cand.children.length) && cand.innerText === mainNode.characters);
            if (match) {
              match.innerText = (insertable as TextNode).characters;
            } else {
              console.warn('no main component match found for text: ', mainNode.characters, mainNode, insertable)
            }
            break;
          case 'CODE_BLOCK':
            match = dom.find((cand) => cand.innerText === mainNode.code);
            if (match) {
              match.innerText = (insertable as CodeBlockNode).code;
            } else {
              console.warn('no main component match found for code block: ', mainNode.code, mainNode, insertable)
            }
            break;
          default:
            console.warn('unhandled insertable main node type: ', mainNode.type, mainNode, insertable);
        }
      }

      if (match) {
        match.linked = true;
        // if leaf is linked, all parents in hierarchy are too
        let parent = match.parent;
        while (parent) {
          parent.linked = true;
          parent = parent.parent;
        }
      }
    }

    ctx.doc += dom.html();
    return 'SKIP';
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
    return `<p>${node.characters}</p>`;
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
  if (isImageNode(node)) {
    type = '__IMAGE';
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

  if (typeof ret === 'string') {
    if (ret !== 'CONTINUE') {
      ctx.doc += ret;
    }
  } else if (Array.isArray(ret)) {
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
    ctx.doc += outer[1] || '';
    if (outer[2]) {
      await outer[2]();
    }
  }
}

function toClassName(name: string): string {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

function normalizeBlockName(name: string): [normalized: string, variants: string[]] {
  let [normalized, ...variants] = name.split('(');
  variants = (variants[0] || '').replace(/\)$/, '').split(' ').map(toClassName).filter(v => !!v);
  normalized = toClassName(normalized);

  return [normalized, variants];
}

export default async function nodeToHTML(nodeId: string): Promise<{ html: string; images: Record<string, Uint8Array> }> {
  const node = figma.getNodeById(nodeId);
  if (!node) {
    return { html: '', images: {} };
  }

  const _libraryDefinition = (await figma.clientStorage.getAsync('library_data'))?.definition || [];

  const ctx: Context = {
    _inSection: false,
    _libraryBlocks: {},
    _libraryDefinition,
    doc: '',
    wrappers: [],
    images: {},
    async getLibraryBlock(this: Context, name: string) {
      const [normalized, variants] = normalizeBlockName(name);
      console.log('normalized, variants: ', normalized, variants);

      if (typeof this._libraryBlocks[name] === 'string') {
        // exact match, includes variants already
        return [this._libraryBlocks[name], normalized, variants];
      }


      let html: string;

      if (typeof this._libraryBlocks[normalized] === 'string') {
        // normalized match, does not include variants
        html = this._libraryBlocks[normalized];
      } else {
        const row = this._libraryDefinition.find(row => normalized === normalizeBlockName(row.name)[0]);
        if (!row || !row.path) return [undefined, undefined, []];

        const resp = await fetch(row.path);
        if (!resp.ok) {
          html = '';
        } else {
          html = await resp.text();
        }
        this._libraryBlocks[normalized] = html;
      }

      // add variants, store as exact match
      if (html && variants.length) {
        this._libraryBlocks[name] = await MessageBus.execute(() => {
          // @ts-ignore
          const div = document.createElement('div');
          div.innerHTML = html;
          const block = div.querySelector(`div.${normalized}`);
          if (variants.length) {
            block.classList.add(...variants);
          }
          return div.innerHTML;
        }, { variants, html, normalized });
      } else if (!variants.length) {
        this._libraryBlocks[name] = this._libraryBlocks[normalized];
      } else {
        this._libraryBlocks[name] = html;
      }

      // save cache
      await figma.clientStorage.setAsync('library_blocks', this._libraryBlocks);
      return [this._libraryBlocks[name], normalized, variants];
    }
  }
  await _nodeToHTML(node, ctx);

  return {
    html: ctx.doc,
    images: ctx.images
  }
}