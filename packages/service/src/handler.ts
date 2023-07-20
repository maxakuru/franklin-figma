import { Router, IRequest } from 'itty-router';
import type { Context, Route } from './types';

import Franklin from 'routes/franklin';
import { AuthAPI, AuthUI } from 'routes/auth';

const router = Router<Request & IRequest, [Context]>();

const fallback: Route = () => {
  return new Response('Not found', { status: 404 });
};

router
  .all('/api/auth/*', AuthAPI)
  .get('/auth/*', AuthUI)
  .get('/*', Franklin)
  .all('/*', fallback);

export default (request: Request, ctx: Context) => router.handle(request, ctx) as Promise<Response>;
