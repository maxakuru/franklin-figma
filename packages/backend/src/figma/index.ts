import MessageBus from '@franklin-figma/messages';
import nodeToHTML from './node2html';

export default function handler() {
  (globalThis as any).api = {
    test: (...args: any[]) => {
      console.log('[backend/figma] called test api: ', args);
      return 'foo';
    },
    nodeToHTML,
    toast: (message: string, error = false, timeout = 3000) => {
      figma.notify(message, { error, timeout });
    }
  }
}