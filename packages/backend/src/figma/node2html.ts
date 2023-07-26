type SceneNodeWithType<T extends SceneNode['type']> = Extract<SceneNode, { type: T }>;

type MaybePromise<R> = R | Promise<R>;

type ReturnDirective = 'SKIP' | 'CONTINUE';

type Visitor = (node: SceneNode) => MaybePromise<string | void | [string, string] | ReturnDirective>;

interface Context {
  doc: string;
  wrappers: [string, string][];
}

const visitors: {
  [T in SceneNode['type']]: (node: SceneNodeWithType<T>) => ReturnType<Visitor>;
} = {
  SLICE: (node) => {

  },
  FRAME: (node) => { },
  GROUP: () => { },
  COMPONENT_SET: () => { },
  COMPONENT: () => { },
  INSTANCE: () => { },
  BOOLEAN_OPERATION: () => { },
  VECTOR: () => { },
  STAR: () => { },
  LINE: () => { },
  ELLIPSE: () => { },
  POLYGON: () => { },
  RECTANGLE: () => { },
  TEXT: () => { },
  STICKY: () => { },
  CONNECTOR: () => { },
  SHAPE_WITH_TEXT: () => { },
  CODE_BLOCK: () => { },
  STAMP: () => { },
  WIDGET: () => { },
  EMBED: () => { },
  LINK_UNFURL: () => { },
  MEDIA: () => { },
  SECTION: () => { },
  HIGHLIGHT: () => { },
  WASHI_TAPE: () => { },
  TABLE: () => { },
}

const _nodeToHTML = async (node: SceneNode, ctx: Context): Promise<string> => {
  const visitor = (
    visitors[node.type] || (() => console.warn('[backend/node2html] node type not handled: ', node.type, node))
  ) as Visitor;

  const ret = await visitor(node);
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

export default async function nodeToHTML(node: SceneNode): Promise<string> {
  return _nodeToHTML(node, {
    doc: '',
    wrappers: []
  });
}