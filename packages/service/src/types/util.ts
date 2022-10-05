// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyOk = any;

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Constructor<T = {}> = new (...args: any[]) => T;

type Join<K, P> = K extends string | number ?
  P extends string | number ?
  `${K}${'' extends P ? '' : '.'}${P}`
  : never : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]];

/**
 * Get leaves of object as period delimited string.
 * @example
 * ```ts
 * const obj = { foo: 0, bar: { baz: { other: 1 }}} as const;
 * type Keys = DeepObjectKeys<typeof obj>;
 * // Keys = 'foo' | 'bar.baz.other'
 * ```
 */
export type DeepObjectKeys<
  T,
  D extends number = 10
> = [D] extends [never] ? never : T extends object ?
{ [K in keyof T]-?: Join<K, DeepObjectKeys<T[K], Prev[D]>> }[keyof T] : '';

export type PrimitiveType =
  | 'object'
  | 'string'
  | 'number'
  | 'boolean'
  | 'function'
  | 'undefined'
  | 'symbol'
  | 'bigint'
  | 'array';

export interface PrimitiveTypeMap {
  object: any;
  string: string;
  number: number;
  boolean: boolean;
  function: (...args: any[]) => any;
  undefined: undefined;
  symbol: symbol;
  bigint: bigint;
  array: unknown[];
}