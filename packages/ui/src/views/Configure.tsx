import { useEffect } from "preact/hooks";
import MessageBus from '@franklin-figma/messages';
import { useRootStore } from "../state/provider";
// import { observer } from "mobx-preact";
// import { observer } from 'mobx-react-lite';
import { observer } from '@franklin-figma/mobx-preact-lite';

import { Fragment } from "preact";

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
                    <Fragment key={node.id}>
                        <p>Selected: {node.name} ({node.id})</p>
                        <p>Type: ({node.type})</p>
                    </Fragment>
                );
            })
        }
    </>)
});

export default ConfigureView;