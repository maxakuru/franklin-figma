import { Progress, makeProgressContext } from '../overlays/progress';
import { capitalize } from '../util';

/**
 * Log in
 */
export const connect = (provider: 'microsoft' | 'google') => async () => {
  const ctx = makeProgressContext({
    title: `Connecting ${capitalize(provider)} account`,
    doneTitle: `Connected ${capitalize(provider)} account`,
    indeterminate: true,
  });
  try {
    await ctx.rootStore.authStore.authenticate(provider, ctx);
  } catch (e) {
    ctx.done();
    console.error('[actions] connect() error: ', e);
  }
  ctx.done();
};

/**
 * Log out
 */
export const disconnect = (provider: 'microsoft' | 'google') => async () => {
  const _disconnect = async () => {
    const ctx = makeProgressContext({
      title: `Disconnecting ${capitalize(provider)} account`,
      doneTitle: `Disconnected ${capitalize(provider)} account`,
      indeterminate: true,
    });
    try {
      await ctx.rootStore.authStore.logout(provider);
      ctx.done();
    } catch (e) {
      // await ctx.close(e);
      console.error('[actions] disconnect() error: ', e);
    }
  };
  // confirmDialog({
  //   title: `Disconnect ${capitalize(provider)}`,
  //   message: `Would you like to disconnect your ${capitalize(provider)} account?`,
  //   onConfirm: _disconnect,
  // });
  _disconnect();
};