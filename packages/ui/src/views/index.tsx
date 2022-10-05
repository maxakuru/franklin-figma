import ViewId from './ids';
import ConfigureView from './Configure';
import SettingsView from './Settings';
// import { observer } from 'mobx-preact';
// import { observer } from 'mobx-react-lite';
import { observer } from '@franklin-figma/mobx-preact-lite';

export const getView = (type: ViewId) => {
  console.log('getView()');

  switch(type) {
    case ViewId.Config:
  console.log('getView() config');

      return <ConfigureView/>;
    case ViewId.Settings:
  console.log('getView() settings');

        return <SettingsView/>;
    default:
      console.error('[ui/views] Unhandled view type: ', type);
      return <></>;
  }
}

export default observer(({type}: {type: ViewId}) => {
  switch(type) {
    case ViewId.Config:
      return <ConfigureView/>;
    case ViewId.Settings:
        return <SettingsView/>;
    default:
      console.error('[ui/views] Unhandled view type: ', type);
      return <></>;
  }
});