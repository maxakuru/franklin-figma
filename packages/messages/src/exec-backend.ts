declare global {
  type ExecFunc = (this: null, ctx: PluginAPI, ...args: any[]) => any;
}

export { };