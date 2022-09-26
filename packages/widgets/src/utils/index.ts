export * from './node';

export function sleep(timeout: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}