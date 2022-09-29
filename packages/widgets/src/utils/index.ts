export * from './node';

export function sleep(timeout: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export function estimateTextWidth(str: string, size: number = 20): number {
  const SHORT_CHARS = ['i', 'f', 'l', 'j', 'I'];
  const shortCount = [...str].filter((c) => SHORT_CHARS.includes(c)).length;
  return (((str.length - shortCount) * .7 + (shortCount) * 0.3) * (size + 3)) * 0.75;
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}