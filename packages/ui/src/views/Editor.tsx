import { useEffect, useState } from "preact/hooks";
import MessageBus from '@franklin-figma/messages';
import { useRootStore } from "../state/provider";
import { observer } from '@franklin-figma/mobx-preact-lite';

import type { FunctionalComponent } from "preact";
import { FranklinEditor } from "src/components/FranklinEditor";
import nodeToHTML from "src/util/node2html";

const EditorView: FunctionalComponent = observer(() => {
  const store = useRootStore();
  const [error, setError] = useState<string>();
  const [content, setContent] = useState<string>();
  
  useEffect(() => {
    (async () => {
      await store.selectionStore.enable();
    })().catch(e => console.error('[ui/views/Editor] failed to init view: ', e));
  }, []);

  useEffect(() => {
    store.setViewReady(false);
    const count = store.selectionStore.nodes.length;

    (async () => {
      if(count > 1) {
        setError('only 1 node can be selected');
      } else if(count < 1) {
        setError('select a node');
      } else {
        const [first] = store.selectionStore.nodes;
        const html = await nodeToHTML(first);
        setContent(html);
      }
    })()
      .catch(e => console.error('[ui/views/Editor] failed to handle selection change: ', e))
      .finally(() => store.setViewReady(true));
  }, [store.selectionStore.nodes]);

  return(<>
      {error && <p>{error}</p>}
      {!error && content && <FranklinEditor html={content}/>}
      {!error && content == null && <p>Nothing to convert!</p>}
  </>)
});

export default EditorView;