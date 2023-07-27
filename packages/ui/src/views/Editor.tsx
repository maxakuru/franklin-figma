import { useEffect, useState } from "preact/hooks";
import MessageBus from '@franklin-figma/messages';
import { useRootStore } from "../state/provider";
import { observer } from '@franklin-figma/mobx-preact-lite';

import type { FunctionalComponent } from "preact";
import { FranklinEditor } from "src/components/FranklinEditor";

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
        const { html, images } = await MessageBus.api.backend.nodeToHTML(first.id);
        console.info('[ui/views/Editor] converted to HTML: ', html, images);

        // insert data urls in place of imgs with hash sources
        const doc = document.createElement('div');
        doc.innerHTML = html;
        doc.querySelectorAll('img').forEach((img) => {
          const hash = img.src.split('hash://')[1];
          const bytes = images[hash];
          const blob = new Blob([bytes]);
          const url = URL.createObjectURL(blob);
          img.src = url;
        });
        
        setContent(doc.innerHTML);
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