import { ErrorWithMessage } from '../types/error';

/**
 * Set public error message, if not already set.
 * Used for ErrorDialog, to bubble the root error cause.
 * @param {Error} error
 * @param {string} message
 * @returns {ErrorWithMessage}
 */
export function setErrorMessage(error: any, message: string): ErrorWithMessage {
  if (!error.publicMessage) {
    error.publicMessage = message;
  }

  if (typeof error.data !== 'object') {
    error._data = {};
  }

  if (typeof error.setData !== 'function') {
    error.setData = (key: string, val: unknown) => {
      let nKey = key;
      if (key in error._data) {
        let i = 0;
        nKey = `${key}-${i++}`;
        while (nKey in error._data) {
          nKey = `${key}-${i++}`;
        }
      }
      error._data[nKey] = val;
    };
  }
  return error;
}

/**
 * Make an error with identical error and publicError properties.
 * @param message the message
 * @returns
 */
export function makePublicError(message: string): ErrorWithMessage {
  return setErrorMessage(Error(message), message);
}
