import React from 'react';
import { View, Text } from '@adobe/react-spectrum';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../../state/provider';

export const NodePanel = observer(() => {
  const { authStore, settingsStore } = useRootStore();

  return (
    <View>
      <Text>node</Text>
    </View>
  );
});
