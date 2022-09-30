const geval = eval;

export function exec(fn: string) {
  const ret = geval(fn);

  return new Promise((resolve, reject) => {
    if (typeof ret === 'object' && typeof ret.then === 'function') {
      ret.then((ret: any) => {
        resolve(ret);
      }).catch((error: any) => {
        reject(error);
      });
    } else {
      resolve(ret);
    }
  });
}