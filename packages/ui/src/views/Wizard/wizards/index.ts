import { setupLibrary } from './library';

const WIZARDS = {
  setupLibrary
} as const;

export type WizardId = keyof typeof WIZARDS;

export default WIZARDS;