import { v4 as uuidv4 } from 'uuid';
import handleRequest from './handler';
import type { Env } from './types';

const setupEnv = (env: Env): Env => {
  env.ENDPOINT = process.env.ENDPOINT as string;
  env.UI_ENDPOINT = process.env.UI_ENDPOINT as string;

  if (process.env.NODE_ENV !== 'development') {
    return env;
  }

  env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
  env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
  env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;
  env.GOOGLE_DEVICECODE_CLIENT_SECRET = process.env.GOOGLE_DEVICECODE_CLIENT_SECRET as string;
  env.MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID as string;
  env.MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET as string;

  if (process.env.UPSTREAM) {
    env.UPSTREAM = process.env.UPSTREAM;
  }

  return env;
};

export default {
  async fetch(request: Request, env: Env) {
    const requestId = uuidv4();
    const ctx = {
      log: console,
      env: setupEnv(env),
      invocation: {
        requestId,
      },
      url: new URL(request.url),
      rewriter: new HTMLRewriter(),
    };

    let resp = await handleRequest(request, ctx);
    resp = new Response(
      resp.body,
      resp,
    );
    resp.headers.set('x-request-id', requestId);
    return resp;
  },
};
