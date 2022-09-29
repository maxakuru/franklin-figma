import React, { useCallback, useEffect, useState } from "react";
import MessageBus from '@franklin-figma/messages';
import { ViewId } from "./views/ids";
import { observer } from 'mobx-react-lite';
import { useRootStore } from "./state/provider";
import View from "./views";

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
            store.setInitialized();
        });
        MessageBus.send('ui:ready');
    }, []);

    return(<>
        <h1>{store.viewType}</h1>
        {
            (!store.ready || !store.viewType || !store.viewReady) && <>Loading...</>
        }
        {
            store.ready && store.viewType && <View type={store.viewType}/>
        }
    </>)
});

export default App;