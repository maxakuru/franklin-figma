import { AnyOk } from 'src/types';
import { setupLibrary } from './library';

const WIZARDS = {
  setupLibrary
} as const;

export type WizardId = keyof typeof WIZARDS;
export const WizardId = Object.keys(WIZARDS).reduce<Record<WizardId, WizardId>>((prev, cur) => {
  prev[cur as WizardId] = cur as WizardId;
  return prev;
}, {} as AnyOk);

export default WIZARDS;