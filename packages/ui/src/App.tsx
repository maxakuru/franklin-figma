import React, { useCallback, useEffect, useState } from "react";
import MessageBus from '@franklin-figma/messages';



const App = () => {
    const [loading, setLoading] = useState(true);
    const [uiType, setUiType] = useState<'config'>();
    const [nodeType, setNodeType] = useState<'PAGE'|'FORM'>();
    const [nodeId, setNodeId] = useState<string>();
    const [selectedNodes, setSelectedNodes] = useState<SceneNode[]>();

    useEffect(() => {
        MessageBus.once('ui:init', async (payload) => {
            const { 
                uiType: pUiType, 
                nodeType: pNodeType, 
                nodeId: pNodeId 
            } = payload;
            const [node, selectedNodes] = await MessageBus.execute((figma) => {
                return [figma.getNodeById(pNodeId), figma.currentPage.selection];
            }, { pNodeId });

            console.log('[UI] initialized - node, selectedNodes: ', node, selectedNodes);

            setSelectedNodes(selectedNodes as SceneNode[]);
            setNodeType(pNodeType);
            setUiType(pUiType);
            setNodeId(pNodeId);
            setLoading(false);
        });
        MessageBus.send('ui:ready');

        MessageBus.on('selection:change', ({nodes}) => {
            setSelectedNodes(nodes);
        });
    }, []);

    return(<>
        <h1>{loading ? 'Loading...' : uiType}</h1>
        <p>{nodeType} ({nodeId})</p>
        { loading || !selectedNodes || !selectedNodes.length 
            ? <p>Select a node to configure it!</p> 
            : selectedNodes.map((node) => {
                return (
                    <React.Fragment key={node.id}>
                        <p>Selected: {node.name} ({node.id})</p>
                        <p>Type: ({node.type})</p>
                    </React.Fragment>
                );
            })
        }
    </>)
};

export default App;