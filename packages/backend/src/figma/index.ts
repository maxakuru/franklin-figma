import MessageBus from '@franklin-figma/messages';
import { Widget } from '@franklin-figma/widgets';

export default function handler() {

  // figma.currentPage.setPluginData('test', JSON.stringify({ test: 1 }));

  MessageBus.on('test', (data) => {
    console.log('[backend] on test: ', data);
    MessageBus.send('test', { received: data });
    console.log('[backend] currentPage: ', figma.currentPage);
    console.log('[backend] currentPage plugin data: ', figma.currentPage.getPluginData('test'));
  });

  figma.on('selectionchange', (...e) => {
    console.log('selection changed: ', e, figma.currentPage.selection);
  })
  figma.widget.register(Widget);
}