import { ContentType } from "def";
import { AuthProvider } from "routes/auth/types";
import { Context, PrimitiveType, PrimitiveTypeMap } from "../types";

export * from './cookie';
export * from './session';


/**
 * Check whether a variable is a type.
 */
export function isType<
  TType extends PrimitiveType,
  TRet = PrimitiveTypeMap[TType]>(
    o: unknown,
    type: TType,
  ): o is TRet {
  if (type === 'object') {
    return o != null && typeof o === 'object' && !Array.isArray(o);
  }
  if (type === 'array') {
    return Array.isArray(o);
  }
  return typeof o === type;
}

export async function fetchUpstream(url: string, requestInit: RequestInit, ctx: Context) {
  const req = new Request(url, requestInit);
  if (req.headers.has('host')) {
    req.headers.set('x-forwarded-host', req.headers.get('host') as string);
  }

  let resp = await fetch(req, { cf: { cacheTtl: 60 } });
  resp = new Response(resp.body, resp);
  resp.headers.set('access-control-allow-origin', ctx.env.ENDPOINT);
  resp.headers.delete('age');
  resp.headers.delete('x-robots-tag');
  return resp;
}

export function redirect(path: string, ctx: Context) {
  return new Response(null, {
    status: 302,
    headers: {
      location: `${ctx.env.ENDPOINT}${path}`
    }
  })
}

export function errorResponse(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      'content-type': ContentType.JSON
    }
  })
}

export async function logErrorBody(response: Response, provider: AuthProvider, ctx: Context): Promise<Response> {
  try {
    const data = await response.text();
    ctx.log.error(`[auth/${provider}] Error response body: `, data);
    return new Response(data, response);
  } catch (e) {
    ctx.log.error(`[auth/${provider}] Failed to parse: `, response.body);
  }

  return response;
}