import ViewId from './ids';
import ConfigureView from './Configure';
import SettingsView from './Settings';
import WizardView from './Wizard';
import EditorView from './Editor';
import MenuView from './Menu';

import { observer } from '@franklin-figma/mobx-preact-lite';

export default observer(({type}: {type: ViewId}) => {
  switch(type) {
    case ViewId.Menu:
      return <MenuView/>;
    case ViewId.Config:
      return <ConfigureView/>;
    case ViewId.Settings:
      return <SettingsView/>;
    case ViewId.Wizard:
      return <WizardView/>;
    case ViewId.Editor:
      return <EditorView/>;
    default:
      console.error('[ui/views] Unhandled view type: ', type);
      return <></>;
  }
});