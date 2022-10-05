import { fetchUpstream } from 'util';
import type { Route } from '../types';

const Franklin: Route = async (request, ctx) => {
  const { env, log, url } = ctx;

  if (env.CACHE_GEN) {
    url.searchParams.set('gen', env.CACHE_GEN);
  }

  const upstreamUrl = `${env.UPSTREAM}${url.pathname}${url.search}`;
  log.debug('[Franklin] fetching: ', upstreamUrl);

  return fetchUpstream(upstreamUrl, request, ctx);
};

export default Franklin;
