import { Widget, ENABLE_WIDGET } from '@franklin-figma/widgets';
import MessageBus, { serialize } from '@franklin-figma/messages';

const RESIZE_EVENTS = true;

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function showUI(opts: ShowUIOptions) {
  figma.showUI(
    `<script>
      window.location.href = "${globalThis.UI_ENDPOINT}/plugin/ui";
    </script>`,
    {
      ...opts,
      title: `${opts.title} (AEM Franklin)`
    }
  );
}

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
    console.log('[backend] figma drop event: ', e);
    MessageBus.sendAll('drop:*', e as DropEvent & Record<string, unknown>);
    return true;
  });
}

function initResizeEvents() {
  if (!RESIZE_EVENTS) return;

  let _viewType = 'menu';

  MessageBus.on('ui:change', ({ viewType }) => {
    if (viewType === _viewType) return;
    if (viewType === 'editor') {
      figma.ui.resize(
        Math.ceil(figma.viewport.bounds.width * figma.viewport.zoom * 0.5),
        Math.ceil(figma.viewport.bounds.height * figma.viewport.zoom)
      );
      // figma.ui.reposition(
      //   Math.ceil(figma.viewport.bounds.width * 0.5),
      //   0
      // );
    }

    _viewType = viewType;
  });
}

export function wrapCommon(handler: () => void) {
  return () => {
    if (ENABLE_WIDGET) {
      figma.widget.register(Widget);
    }
    attachFigmaListeners();
    handler();

    if (!ENABLE_WIDGET) {
      // figma.viewport.scrollAndZoomIntoView([focusNode]);
      const { bounds, zoom } = figma.viewport;
      const height = Math.round(clamp(bounds.height * zoom * 0.6, 700, 1080));
      const width = Math.round(clamp(bounds.width * zoom * 0.3, 300, 700));

      showUI({
        title: 'Menu',
        position: {
          x: bounds.width * zoom * 0.7,
          y: bounds.height * zoom * 0.4
        },
        width,
        height,
        themeColors: true
      });
      MessageBus.once('ui:ready', () => {
        MessageBus.send('ui:init', { uiType: 'menu' });
      });

      initResizeEvents();
    }
  }
}