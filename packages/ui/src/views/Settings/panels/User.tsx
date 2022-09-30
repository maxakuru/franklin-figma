import * as React from 'react';
import { Text, ButtonGroup, ActionButton } from '@adobe/react-spectrum';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '../../../state/provider';
import { Edit } from '../../../spectrumIcons';

import { connect } from '../../../actions/auth';

export const UserPanel = observer(() => {
  const { authStore, settingsStore } = useRootStore();

  return (
    <>
      <ButtonGroup>
        <ActionButton onPress={connect('microsoft')}>
          <Edit />
          <Text>Connect Microsoft</Text>
        </ActionButton>
        <ActionButton onPress={connect('google')}>
          <Edit />
          <Text>Connect Google</Text>
        </ActionButton>
      </ButtonGroup>
    </>
  );
});
