import { useCallback, useEffect, useState } from "preact/hooks";
import { Flex, Item, TabList, TabPanels, Tabs, View } from "@adobe/react-spectrum";
// import { observer } from 'mobx-preact';
import { observer } from 'mobx-react-lite';

import { useRootStore } from "../../state/provider";
import { Panel } from "../../types";
import allPanels from "./panels";

const SettingsView: React.FC = observer(() => {
  const store = useRootStore();
  const { settingsStore } = store;
  const [ panels, setPanels ] = useState<Panel[]>([]);

    useEffect(() => {
      console.log('[ui/Settings] initialize');
      (async () => {
        await settingsStore.enable();
        setPanels(allPanels.filter(panel => settingsStore.enabledPanels.includes(panel.id)));
        store.setViewReady(true);
      })().catch((e) => {
        console.error('[ui/Settings] Failed to initialize: ', e);
      });
    }, []);

    const setIndex = useCallback((id: string) => () => {
      settingsStore.setPanelId(id);
    }, []);

    return(
        store.viewReady &&
        <>
        { panels.length === 1 
          ? <Flex direction='column' marginY='size-100'>
            {panels[0].children}
          </Flex>
          : <Tabs
            aria-label="Panels"
            items={panels}
            density="compact"
            selectedKey={settingsStore.panelId}
          >
            <View marginY='size-100'>
              <TabList>
                {(item: Panel) => (
                  <Item textValue={item.name}>
                    <span onClick={setIndex(item.id)}>{item.name}</span>
                  </Item>
                )}
              </TabList>
            </View>

            <TabPanels>
              {(item: Panel) => (
                <Item>
                  <Flex direction='column'>
                    {item.children}
                  </Flex>
                </Item>
              )}
            </TabPanels>
          </Tabs>
    }</>);
});

export default SettingsView;