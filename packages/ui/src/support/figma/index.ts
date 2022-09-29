export * from './storage';

export function openBrowser(url: string) {
  window.open(url, '_blank');
}