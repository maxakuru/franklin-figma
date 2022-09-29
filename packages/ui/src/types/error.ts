export interface ErrorWithMessage extends Error {
  publicMessage: string;
  _data: Record<string, unknown>;
  setData(key: string, value: unknown): ErrorWithMessage;
}