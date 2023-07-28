globalThis.UI = true;
globalThis.UI_ENDPOINT = process.env.UI_ENDPOINT;
globalThis.PLUGIN_ID = process.env.PLUGIN_ID;
globalThis.DEV = process.env.DEV as unknown as boolean;

const parseNode = (window as any).parseNode = (node: HTMLElement): any => {
  return {
    selector: '',
    tag: node.tagName,
    attrs: Object.fromEntries(Object.values(node.attributes).map((attr: any) => [attr.name, attr.value])),
    classes: node.className.split(' '),
    children: [...(node as any).childNodes].map(parseNode),
  }
}