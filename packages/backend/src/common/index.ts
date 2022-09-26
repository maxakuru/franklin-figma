import { Widget } from '@franklin-figma/widgets';

export function wrapCommon(handler: () => void) {
  return () => {
    figma.widget.register(Widget);
    handler();
  }
}