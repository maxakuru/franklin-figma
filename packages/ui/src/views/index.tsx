import * as React from 'react';
import ViewId from './ids';
import ConfigureView from './Configure';
import SettingsView from './Settings';
import { observer } from 'mobx-react-lite';

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