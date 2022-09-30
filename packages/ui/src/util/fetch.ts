
import MessageBus from '@franklin-figma/messages';
import { ProgressContext, ErrorWithMessage } from '../types';
import { makePublicError } from './error';
import { sleep } from './object';

export type CancelablePromise<T> = Promise<T> & {
  cancel: (reason?: any) => void;
}

export const ENCODED_FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded;charset=UTF-8';

export function makeEncodedFormData(obj: Record<string, string | number | boolean>) {
  const formBody = [];
  for (const [key, val] of Object.entries(obj)) {
    const eKey = encodeURIComponent(key);
    const eVal = encodeURIComponent(val);
    formBody.push(`${eKey}=${eVal}`);
  }
  return formBody.join('&');
}

/**
 * Poll a URL
 *
 * @param url - url to poll
 * @param ctx - progress ctx for cancelation
 * @param init - request init
 * @param interval - seconds, default to 5 seconds
 * @param timeout - seconds, default to 15 minutes
 * @returns
 */
export async function poll(
  url: string,
  ctx: ProgressContext,
  init?: RequestInit,
  interval = 5,
  timeout = 120,
): Promise<Response> {
  console.debug(`poll(${url})`);
  const _poll = async (): Promise<Response | undefined> => {
    const resp = await fetch(url, init);
    if (!resp.ok) {
      let err: ErrorWithMessage;
      let data;

      try {
        data = await resp.json();
        // eslint-disable-next-line no-empty
      } catch { }

      if (resp.status !== 400 && resp.status !== 428) {
        console.warn('[util/fetch] poll() error, status: ', resp.status, resp, data);
        err = makePublicError(`Failed to authenticate: ${resp.status}`);
      }

      if (!err) {
        console.warn('[util/fetch] poll() error, data: ', resp.status, resp, data);
        if (data.error) {
          if (data.error === 'authorization_pending') {
            return undefined;
          }
          err = makePublicError(`Failed to authenticate: ${data.error}`);
        }
      }

      if (!err) {
        console.warn('[util/fetch] poll() error, data: ', resp.status, resp);
        err = makePublicError('Failed to authenticate: unknown error');
      }
      err.setData('response', resp);
      throw err;
    }
    if (resp.status === 204) {
      return undefined;
    }
    return resp;
  };

  let timer = 0;
  while (timer < timeout && !ctx.canceled) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await _poll();
    if (resp) {
      return resp;
    }

    // eslint-disable-next-line no-await-in-loop
    await sleep(interval * 1000);
    timer += interval;
  }

  if (ctx.canceled) {
    return;
  }

  throw makePublicError('Failed to authenticate: timeout');
}

export function cancelableFetch(
  url: string,
  init: RequestInit = {},
): CancelablePromise<Response> {
  const controller = new AbortController();
  const { signal, abort } = controller;

  // const promise = MessageBus.execute(() => {
  //   return fetch(url, Object.assign({}, init));
  // }, { url, init });
  const promise = _cancelableFetch(
    url,
    {
      ...init,
      signal,
    },
  ) as CancelablePromise<Response>;

  (promise as any).cancel = abort;
  return promise as any;
}

async function _cancelableFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    let errMessage: string | undefined;
    try {
      const respBody = await resp.json();
      console.error(`[util/fetch] _cancelableFetch() Error: url=${url} status=${resp.status} `
        + `body=${typeof respBody === 'object' ? JSON.stringify(respBody, undefined, 2) : respBody}`);
      errMessage = respBody.message;
    } catch (e) {
      console.error(`[util/fetch] _cancelableFetch() Error: url=${url} status=${resp.status} `
        + `body=${typeof resp.body === 'object' ? JSON.stringify(resp.body, undefined, 2) : resp.body}`);
    }

    let error: Error;
    if (errMessage) {
      error = makePublicError(`Failed to fetch: ${errMessage} (${resp.status})`);
    } else {
      error = Error(`Failed to fetch: ${resp.status}`);
    }
    (error as any).response = resp;
    throw error;
  }
  return resp;
}
