import * as React from 'react';
import { Text, ButtonGroup, ActionButton } from '@adobe/react-spectrum';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '../../../state/provider';
import { Edit } from '../../../spectrumIcons';

export const UserPanel = observer(() => {
  const { authStore, settingsStore } = useRootStore();

  return (
    <>
      <ButtonGroup>
        <ActionButton>
          <Edit />
          <Text>Connect Microsoft</Text>
        </ActionButton>
        <ActionButton>
          <Edit />
          <Text>Connect Google</Text>
        </ActionButton>
      </ButtonGroup>
    </>
  );
});
