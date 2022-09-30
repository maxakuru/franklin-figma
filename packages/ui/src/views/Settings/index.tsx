import React, { useCallback, useEffect, useState } from "react";
import MessageBus from '@franklin-figma/messages';
import { useRootStore } from "../../state/provider";
import { Flex, Item, TabList, TabPanels, Tabs, View } from "@adobe/react-spectrum";
import { Panel } from "../../types";
import panels from "./panels";
import { observer } from "mobx-react-lite";



const SettingsView: React.FC = observer(() => {
  const store = useRootStore();
  const { settingsStore } = store;

    useEffect(() => {
      console.log('[ui/Settings] initialize');
      (async () => {
        await settingsStore.enable();
        store.setViewReady(true);
      })().catch((e) => {
        console.error('[ui/Settings] Failed to initialize: ', e);
      });
    }, []);

    const setIndex = useCallback((i: number) => () => {
      settingsStore.setPanelIndex(i);
    }, []);

    return(
        store.viewReady && 
          <Tabs
            aria-label="Panels"
            items={panels}
            density="compact"
            selectedKey={settingsStore.panelIndex}
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
          </Tabs>);
});

export default SettingsView;