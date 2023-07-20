import { Text, ActionButton, ButtonGroup } from '@adobe/react-spectrum';
import { observer } from '@franklin-figma/mobx-preact-lite';

import { useRootStore } from '../../../state/provider';
import Edit from '@spectrum-icons/workflow/Edit';

export const DocumentPanel = observer(() => {
  const store = useRootStore();
  const { authStore, settingsStore } = store;
 
  return (
    <>
      <ButtonGroup>
        <ActionButton onPress={() => store.openWizard('setupLibrary')}>
            <Edit />
            <Text>Setup Library</Text>
          </ActionButton>
      </ButtonGroup>
    </>
  );
});
