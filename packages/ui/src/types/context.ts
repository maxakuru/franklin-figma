import type React from 'react';
import type { RootStore } from '../state/stores';

export type CancelHandler = (reason?: any) => void | Promise<void>;

export interface BaseStateContext {
  rootStore: RootStore;
}

export type StatefulContext<
  TState extends Record<string, unknown> = Record<string, never>,
> = TState extends Record<string, never> ? BaseStateContext : BaseStateContext & TState;

export type ProgressContext<
  TState extends Record<string, unknown> = Record<string, never>
> = StatefulContext<TState> & StatefulContext<{
  /**
   * Number of ticks expected before action is complete
   */
  totalTicks: number;

  /**
   * Number of ticks already completed
   */
  doneTicks: number;

  /**
   * Whether the action has been canceled
   */
  canceled: boolean;

  /**
   * Percent completion
   */
  percent: number;

  /**
   * Set total ticks expected
   *
   * This can be set at any time during the action.
   *
   * The % completion will only increase, even if `doneTicks`/`totalTicks` drops
   * from a later call to set total ticks.
   */
  setTotalTicks: (ticks: number) => void;

  /**
   * Add progress ticks
   */
  progress: (ticks: number) => void;

  /**
   * Set the current task name
   */
  task: (taskName: string) => void;

  /**
   * Cancel the action
   */
  cancel: () => void;

  /**
   * Register cancel callback
   */
  onCancel: (handler: CancelHandler) => () => void;

  /**
   * Mark progress as done
   */
  done: () => void;

  /**
   * Set message section to a new message or clear it
   * Displayed below the progress spinner
   *
   * @param {string} msg - message as simple or HTML string
   */
  setMessage: (msg?: string | React.ReactElement) => void;
}>;
