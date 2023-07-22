import MessageBus from '@franklin-figma/messages';

export default function handler() {
  // TODO: impl convertToHTML api
  (globalThis as any).api = {
    test: (...args: any[]) => {
      console.log('[backend/figma] called test api: ', args);
      return 'foo';
    }
  }
}