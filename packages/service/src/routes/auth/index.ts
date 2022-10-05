/**
 * Auth flow
 * 
 * 1. user requests to connect auth provider from plugin UI
 * 2. plugin UI (on figma.helix3.dev) requests a session via POST /api/auth/session
 * 3. service creates read/write single-use key pair, creates session(id,expiresAt,state,readKey,writeKey)
 * 4. service responds with id,readKey,writeKey
 * 5. plugin UI opens window to figma.helix3.dev/auth/login, passes writeKey, provider type
 * 6. service responds with web UI from Franklin & adds cookie with writeKey
 * 7. web UI shows confirmation interstitial
 *   7a. on confirm, redirect to oauth provider
 *   7b. on cancel, remove pending session from service
 * 8. in parallel:
 *   9.   user completes authentication through oauth provider
 *   9.1. oauth provider redirects to /api/auth/callback with state=writeKey
 *   9.2. service compares writeKey & cookie
 *      9.2a. if not match or invalid, respond 401
 *      9.2b. if match, exchange code for tokens, update session with tokens, invalidate writeKey, respond 200
 *   9.3. web UI shows success/failure page, "you can now close this window"
 * 
 *   10. plugin UI polls service with readKey until statusCode !== 204
 *      10.1a. on 4xx/5xx show error
 *      10.1b. on 200 receives refreshToken,accessToken
 */

import { Router } from 'itty-router';
import * as session from "./session";
import * as ui from "./ui";

const AuthAPIRouter = Router<Request>({ base: '/api/auth' })
  .post('/session', session.create)
  .get('/callback', session.activate)
  .get('/session/:id', session.poll);

export const AuthAPI = AuthAPIRouter.handle;

const AuthUIRouter = Router<Request>({ base: '/auth' })
  .get('/login', ui.login)
  .get('/success', ui.success)
  .get('/failure', ui.failure)
  .get('/logout', ui.logout);

export const AuthUI = AuthUIRouter.handle;