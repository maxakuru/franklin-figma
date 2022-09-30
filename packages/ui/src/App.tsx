import * as React from 'react';
import { useEffect } from "react";
import MessageBus from '@franklin-figma/messages';
import { observer } from 'mobx-react-lite';
import { useRootStore } from "./state/provider";
import View from "./views";
import { Flex, ProgressCircle } from "@adobe/react-spectrum";
// import { Progress } from './overlays/progress';
// import root from './state/stores';

import './App.css';

const App = observer(() => {
    const store = useRootStore();

    useEffect(() => {
        console.log('[ui/App] render');
        MessageBus.once('ui:init', async (payload) => {
            console.log('[ui/App] init');

            const {
                uiType, 
                nodeType, 
                nodeId
            } = payload;

            store.setNodeId(nodeId);
            store.setViewType(uiType);
            store.setNodeType(nodeType);
            store.setInitPayload(payload);
        });
        MessageBus.send('ui:ready');
    }, []);

    return(<Flex direction='column' height='100%' marginX={8}>
        {
            (!store.ready || !store.viewType || !store.viewReady) 
            && <div style={{
                background: 'var(--figma-color-bg)', 
                position: "absolute", 
                left: 0, 
                right: 0, 
                top: 0, 
                bottom: 0,
                zIndex: 100
                }}>
                    <Flex 
                    direction='column' 
                    justifyContent='space-around' 
                    alignItems='center'
                    height='100%'>
                        <ProgressCircle aria-label='Loading' isIndeterminate={true} size='L'/>
                </Flex>
            </div>
        }
        {
            store.ready && store.viewType && <View type={store.viewType}/>
        }
    </Flex>)
});

export default App;