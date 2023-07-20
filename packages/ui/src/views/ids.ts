export type ViewId = 'config' | 'settings' | 'wizard';

export const ViewId = {
  Config: 'config',
  Settings: 'settings',
  Wizard: 'wizard'
} as const;

export default ViewId;