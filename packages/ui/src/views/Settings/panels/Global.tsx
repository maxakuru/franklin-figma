import * as React from 'react';
import { Text, View } from '@adobe/react-spectrum';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '../../../state/provider';

export const GlobalPanel = observer(() => {
  const { authStore, settingsStore } = useRootStore();

  return (
    <View>
      <Text>global</Text>
    </View>
  );
});
