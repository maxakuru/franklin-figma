import { Text, ButtonGroup, ActionButton } from '@adobe/react-spectrum';
import { observer } from '@franklin-figma/mobx-preact-lite';

import { useRootStore } from '../../../state/provider';
import Edit from '@spectrum-icons/workflow/Edit';

import { connect, disconnect } from '../../../actions/auth';

export const UserPanel = observer(() => {
  const { authStore, settingsStore } = useRootStore();

  return (
    <>
      <ButtonGroup>
        {
        !authStore.isMicrosoftAuthenticated 
        ? <ActionButton onPress={connect('microsoft')}>
            <Edit />
            <Text>Connect Microsoft</Text>
          </ActionButton>
        : <ActionButton onPress={disconnect('microsoft')}>
            <Edit />
            <Text>Disconnect Microsoft</Text>
          </ActionButton>
        }

        {
        !authStore.isGoogleAuthenticated 
        ? <ActionButton onPress={connect('google')}>
            <Edit />
            <Text>Connect Google</Text>
          </ActionButton>
        : <ActionButton onPress={disconnect('google')}>
            <Edit />
            <Text>Disconnect Google</Text>
          </ActionButton>
        }
      </ButtonGroup>
    </>
  );
});
