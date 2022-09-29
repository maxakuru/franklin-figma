import { Widget } from '@franklin-figma/widgets';
import MessageBus, { serialize } from '@franklin-figma/messages';

function attachFigmaListeners() {
  figma.on('currentpagechange', () => {
    MessageBus.send('currentpage:change', figma.currentPage);
  });

  figma.on('close', () => {
    MessageBus.sendAll('ui:close');
  });

  figma.on('selectionchange', () => {
    const nodes = figma.currentPage.selection.map((n) => {
      const serialized = serialize(n);
      let cur = n;
      let curSer = serialized;
      while (cur.parent) {
        (curSer as any).parent = { id: cur.parent.id };

        cur = cur.parent as any;
        curSer = curSer.parent as any;
      }
      return serialized;
    });
    MessageBus.send('selection:change', { nodes });
  });

  figma.on('drop', (e: DropEvent) => {
    console.log('figma drop event: ', e);
    return true;
  });
}

export function wrapCommon(handler: () => void) {
  return () => {
    figma.widget.register(Widget);
    attachFigmaListeners();
    handler();
  }
}