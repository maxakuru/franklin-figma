export type ViewId = 'config' | 'settings' | 'wizard' | 'editor' | 'menu';

export const ViewId = {
  Config: 'config',
  Settings: 'settings',
  Wizard: 'wizard',
  Editor: 'editor',
  Menu: 'menu'
} as const;

export default ViewId;