import { Text, View } from '@adobe/react-spectrum';
// import { observer } from 'mobx-preact';
// import { observer } from 'mobx-react-lite';
import { observer } from '@franklin-figma/mobx-preact-lite';

import { useRootStore } from '../../../state/provider';

export const DocumentPanel = observer(() => {
  const { authStore, settingsStore } = useRootStore();

  return (
    <View>
      <Text>document</Text>
    </View>
  );
});
