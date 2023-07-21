export type ViewId = 'config' | 'settings' | 'wizard' | 'editor';

export const ViewId = {
  Config: 'config',
  Settings: 'settings',
  Wizard: 'wizard',
  Editor: 'editor'
} as const;

export default ViewId;