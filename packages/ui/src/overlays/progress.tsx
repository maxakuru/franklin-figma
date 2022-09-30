
import React from 'react';
import ReactDOM from 'react-dom';
import {
  ProgressBar,
  defaultTheme,
  Provider,
} from '@adobe/react-spectrum';

import type { BaseStateContext, ProgressContext, CancelHandler } from '../types';
import type { RootStore } from '../state/stores';
import rootStore from '../state/stores/root.store';

interface ProgressOptionsInternal {
  title: string;
  doneTitle: string;
  errorTitle: string;
  indeterminate: boolean;
}

export interface ProgressOptions<T extends BaseStateContext> extends ProgressOptionsInternal {
  baseCtx?: T;
}

interface ProgressState {
  taskName: string;
  error: boolean | string;
  done: boolean;
  totalTicks?: number;
  doneTicks: number;
  indeterminate: boolean;
  phantomTicks: number;
  cancelCallback?: (reason?: any) => void | Promise<void>;
}

interface ProgressProps extends ProgressOptionsInternal {
  totalTicks?: number;
  close: (reason?: any) => Promise<void> | void;
}

function getOpts<T extends BaseStateContext>(
  opts: Partial<ProgressOptions<T>>,
): Required<ProgressOptionsInternal> & ProgressOptions<T> {
  return {
    title: opts.title || 'Progress',
    doneTitle: opts.title,
    errorTitle: 'Error',
    indeterminate: false,
    ...opts,
  };
}

export class Progress extends React.Component<ProgressProps, ProgressState> {
  constructor(props: ProgressProps) {
    super(props);
    this.state = {
      cancelCallback: () => {},
      phantomTicks: 0,
      totalTicks: props.totalTicks,
      doneTicks: 0,
      taskName: 'In progress',
      error: false,
      done: false,
      indeterminate: props.indeterminate ?? false,
    };
  }

  setTotalTicks(newTotal: number) {
    if (this.state.totalTicks == null) {
      this.setState({ totalTicks: newTotal });
      return;
    }
    const { doneTicks, phantomTicks, totalTicks } = this.state;
    const newPhantom = Math.ceil((newTotal * (doneTicks + phantomTicks)) / totalTicks) - doneTicks;
    this.setState({ totalTicks: newTotal, phantomTicks: newPhantom });
  }

  addDoneTicks(ticks: number) {
    let { phantomTicks, doneTicks } = this.state;
    // remove new done ticks from phantom ticks
    // this is to avoid jumping backwards in progress when
    // setTotalTicks() is called after progress is already made
    if (phantomTicks > 0) {
      if (phantomTicks >= ticks) {
        phantomTicks -= ticks;
        doneTicks += ticks;
      } else {
        phantomTicks = 0;
        doneTicks += ticks - phantomTicks;
      }
    } else {
      doneTicks += ticks;
    }
    this.setState({
      doneTicks,
      phantomTicks,
    });
  }

  /**
   * -1 for indeterminate
   */
  get progress(): number {
    if (this.state.done) {
      return 100;
    }
    if (this.state.totalTicks == null) {
      return -1;
    }

    const { totalTicks, doneTicks, phantomTicks } = this.state;
    return Math.min(((doneTicks + phantomTicks) / totalTicks) * 100, 99);
  }

  reset() {
    this.setState({
      phantomTicks: 0,
      totalTicks: undefined,
      doneTicks: 0,
      taskName: '-',
      error: false,
      done: false,
      indeterminate: false,
    });
  }

  done(): void {
    this.setState({ done: true });
  }

  async close(reason?: any): Promise<void> {
    await this.props.close(reason);
  }

  async cancel(reason?: any) {
    console.debug(`[Progress] cancel() reason=${reason}`);

    const { cancelCallback } = this.state;
    const { close } = this.props;

    if (cancelCallback) {
      await cancelCallback(reason);
    }
    await close();
  }

  setMessage(msg: string | React.ReactElement = '') {
    const node = document.querySelector('#progress-message');
    if (!node) {
      return;
    }

    if (typeof msg === 'string') {
      node.innerHTML = msg;
    } else {
      ReactDOM.render(msg, node);
    }
  }

  render() {
    const {
      close, title, errorTitle, doneTitle,
    } = this.props;

    const {
      done, error, taskName, indeterminate,
    } = this.state;

    const cancel = this.cancel.bind(this);
    const errMsg: string = typeof error === 'string' ? error : 'Something went wrong!';
    const pct = this.progress;

    return (
      <Provider theme={defaultTheme} colorScheme="light">
        <div className="dialog">
          <form>
            <h1>{error ? errorTitle : done ? doneTitle : title}</h1>
            <hr />
            <span className="col">
              <div className="content">
                <span className="row around progress-bar">
                  {error ? (
                    <p>{errMsg}</p>
                  ) : indeterminate && done ? (
                    "DONE"
                  ) : (
                    <ProgressBar
                      width={'100%'}
                      label={done ? 'Done' : taskName}
                      minValue={0}
                      maxValue={100}
                      isIndeterminate={indeterminate}
                      value={indeterminate ? undefined : pct}
                    />
                  )}
                </span>
              </div>

              <span className="row">
                <div id="progress-message"></div>
              </span>

              <span className="row end">
                {error || done ? (
                  <button className="button-submit" uxp-variant="cta" onClick={close}>
                    Close
                  </button>
                ) : (
                  <button className="button-submit" uxp-variant="warning" onClick={cancel}>
                    Cancel
                  </button>
                )}
              </span>
            </span>
          </form>
        </div>
      </Provider>
    );
  }

  /**
   * Display the progress dialog
   * @param title Title of the dialog
   */
  static async present(
    opts: Pick<ProgressOptionsInternal, 'title'> & Partial<ProgressOptionsInternal>,
  ): Promise<void> {
    
  }
}

export function makeProgressContext<T extends BaseStateContext>(
  opts: Partial<ProgressOptions<T>>,
): ProgressContext {
  const cleanOpts = getOpts(opts);
  const close = () => rootStore.popOverlay();
  rootStore.pushOverlay(<Progress close={close} {...cleanOpts}/>)
  const cancelHandlers: CancelHandler[] = [];

  const ctx: ProgressContext = {
    ...(opts.baseCtx || { rootStore }),
    canceled: false,
    setMessage: (msg?: string | React.ReactElement) => {
      // instance.setMessage(msg);
      console.log('setMessage: ', msg);
    },
    setTotalTicks: (ticks: number) => {
      // instance.setTotalTicks(ticks);
      console.log('setTotalTicks: ', ticks);

    },
    task: (taskName: string): void => {
      // instance.setState({ taskName });
      console.log('set task name: ', taskName);
    },
    progress: (ticks: number) => {
      // instance.addDoneTicks(ticks);
      console.log('addDoneTicks: ', ticks);

    },
    cancel: (reason?: any) => {
      // instance.cancel(reason);
      console.log('cancel reason: ', reason);

    },
    onCancel: (handler: CancelHandler) => {
      const i = cancelHandlers.push(handler);
      return () => {
        delete cancelHandlers[i - 1];
      };
    },
    done: () => {
      // instance.done();
      console.log('done: ');
    },
  } as ProgressContext;

  // set the instance's cancelCallback
  // this will fan out to other handlers
  const cancelCallback = async (): Promise<void> => {
    ctx.canceled = true;
    await Promise.allSettled(cancelHandlers.map((ch) => ch && ch()));
  };
  // instance.setState({ cancelCallback });

  // proxy getters
  Object.defineProperties(ctx, {
    totalTicks: {
      // get: () => instance.state.totalTicks,
      get: () => 0
    },
    doneTicks: {
      // get: () => instance.state.doneTicks,
      get: () => 0
    },
    percent: {
      // get: () => instance.progress,
      get: () => 0
    },
  });

  return ctx;
}
