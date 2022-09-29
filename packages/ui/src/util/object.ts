import { AnyOk } from '../types';

/**
 * Check if objects are shallowly equal
 * @param {Object} obj1
 * @param {Object} obj2
 * @returns {boolean}
 */
export function shallowEqual(obj1: AnyOk, obj2: AnyOk): boolean {
  if (obj1 === obj2) {
    return true;
  }
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  for (const key of Object.keys(obj2)) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}

export function deepEqual(obj1: AnyOk, obj2: AnyOk): boolean {
  if (obj1 === obj2) {
    return true;
  }
  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2) || obj1.length !== obj2.length) {
      return false;
    }
    if (obj1.findIndex((v, i) => !deepEqual(v, obj2[i])) > -1) {
      return false;
    }
  } else {
    for (const [k, v] of Object.entries(obj2)) {
      if (!deepEqual(obj1[k], obj2[k])) {
        return false;
      }
    }
  }
  return true;
}

export function isObjectOrArray(o: AnyOk): o is Record<string, unknown> | AnyOk[] {
  return !!o && typeof o === 'object';
}

/**
 * Check if object is strictly an object,
 * not an array or null.
 */
export function isStrictlyObject(o: AnyOk): o is Record<string, unknown> {
  return !!o && typeof o === 'object' && !Array.isArray(o);
}

/**
 * Check if array has 0 items or all nullish entries.
 */
export function isEmptyArray(a: AnyOk): boolean {
  return Array.isArray(a) && (!a.length || !a.filter((i) => !!i).length);
}

/**
 * Check if object has no keys.
 */
export function isEmptyObject(o: AnyOk): boolean {
  return typeof o === 'object' && !Array.isArray(o) && isEmptyArray(Object.values(o));
}

/**
 * Check if object has no keys,
 * array has no items,
 * or all values are nullish/falsey.
 */
export function isEmpty(o: AnyOk): boolean {
  return isEmptyObject(o) || isEmptyArray(o);
}

/**
 * Check if variable is nullish, falsely, empty object, or object with all nullish values.
 */
export function isFunctionallyEmpty(o: AnyOk) {
  return !o || isEmpty(o);
}

/**
 * Check if any of the keys in `keys` points to a nullish value.
 */
export function anyNullishValues(o: AnyOk, keys: string[]): boolean {
  if (!isStrictlyObject(o)) {
    return true;
  }
  if (keys.length === 0) {
    return false;
  }
  for (const key of keys) {
    if (isFunctionallyEmpty(o[key])) {
      return true;
    }
  }

  return false;
}

export function sleep(t: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((r) => setTimeout(r, t));
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function flattenObject(
  obj: unknown,
): Record<string, string | number | boolean> {
  if (!isObjectOrArray(obj)) {
    return obj as Record<string, string>;
  }
  const ret: Record<string, string | number | boolean> = {};

  for (const [k, v] of Object.entries(obj)) {
    if (isObjectOrArray(v)) {
      const obj2 = flattenObject(v);
      for (const [k2, v2] of Object.entries(obj2)) {
        ret[`${k}.${k2}`] = v2;
      }
    } else {
      ret[k] = v;
    }
  }
  return ret;
}

export function enumKeyFromValue<
  T extends object,
  K extends keyof T
>(o: T, val: string | number): K | undefined {
  return Object.keys(o)[Object.values(o).indexOf(val)] as K;
}
