import { Widget } from '@franklin-figma/widgets';
import MessageBus from '@franklin-figma/messages';

function attachFigmaListeners() {
  figma.on('currentpagechange', () => {
    MessageBus.send('currentpage:change', figma.currentPage);
  });

  figma.on('close', () => {
    MessageBus.sendAll('ui:close');
  });

  figma.on('selectionchange', () => {
    const nodes = figma.currentPage.selection.map(({ id, type }) => ({ id, type }));
    MessageBus.send('selection:change', { nodes });
  });
}

export function wrapCommon(handler: () => void) {
  return () => {
    figma.widget.register(Widget);
    attachFigmaListeners();
    handler();
  }
}