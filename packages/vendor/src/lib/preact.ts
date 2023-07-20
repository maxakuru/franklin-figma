export {
  render,
  createContext,
  cloneElement,
  createElement,
  createRef,
  Component,
  isValidElement,
  toChildArray,
  Fragment,
  h,
  hydrate,
  options
} from 'preact';

export * from 'preact/hooks';
// @ts-ignore
export * from 'preact/compat';
export * from 'preact/jsx-runtime';

import * as compat from 'preact/compat';

export default compat;