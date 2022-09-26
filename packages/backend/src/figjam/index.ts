import MessageBus from "@franklin-figma/messages";

export default function handler() {
  MessageBus.on('test', (data) => {
    console.log('[backend] on test: ', data);
    MessageBus.send('test', { received: data });
    console.log('[backend] currentPage: ', figma.currentPage);
    console.log('[backend] currentPage plugin data: ', figma.currentPage.getPluginData('test'));
  });

  figma.on('selectionchange', (...e) => {
    console.log('selection changed: ', e, figma.currentPage.selection);
  })
}