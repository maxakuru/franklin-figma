import * as React from 'react';
import { useCallback, useEffect, useState } from "react";
import MessageBus from '@franklin-figma/messages';
import { useRootStore } from "../state/provider";
import { observer } from "mobx-react-lite";

const ConfigureView: React.FC = observer(() => {
  const store = useRootStore();
  const { selectionStore: selection } = store;
    useEffect(() => {
      (async () => {
         await selection.enable();
         store.setViewReady(true);
      })().catch(e => {
        console.error('Failed to initialize ConfigureView: ', e);
      });
    }, []);

    console.log('selection: ', selection.nodes);

    return(<>
        <p>{store.nodeType} ({store.nodeId})</p>
        { !selection.nodes || !selection.nodes.length 
            ? <p>Select a node to configure it!</p> 
            : !selection.nodesUnderRoot.length 
              ? <p>Cannot configure a node outside of the {store.nodeType.toLowerCase()}</p> 
              : selection.nodesUnderRoot.map((node) => {
                return (
                    <React.Fragment key={node.id}>
                        <p>Selected: {node.name} ({node.id})</p>
                        <p>Type: ({node.type})</p>
                    </React.Fragment>
                );
            })
        }
    </>)
});

export default ConfigureView;