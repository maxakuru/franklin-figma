import React, { useCallback, useEffect, useState } from "react";
import MessageBus from '@franklin-figma/messages';



const App = () => {
    const [loading, setLoading] = useState(true);
    const [uiType, setUiType] = useState<'config'>();
    const [nodeType, setNodeType] = useState<'PAGE'|'FORM'>();
    const [nodeId, setNodeId] = useState<string>();

    useEffect(() => {
        MessageBus.once('ui:init', async (payload) => {
            console.log('[UI] init: ', payload);
            const { 
                uiType: pUiType, 
                nodeType: pNodeType, 
                nodeId: pNodeId 
            } = payload;
            const node = await MessageBus.execute((figma) => {
                return figma.getNodeById(pNodeId);
            }, { pNodeId });
            console.log('node: ', node);
            setNodeType(pNodeType);
            setUiType(pUiType);
            setNodeId(pNodeId);
            setLoading(false);
        });
        MessageBus.send('ui:ready');
    }, []);

    return(<>
        <h1>{loading ? 'Loading...' : uiType}</h1>
        <p>{nodeType} ({nodeId})</p>
    </>)
};

export default App;