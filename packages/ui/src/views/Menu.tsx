import { useEffect } from "preact/hooks";
import { Button, ButtonGroup, Text, Flex, Divider } from '@adobe/react-spectrum';
import { useRootStore } from "../state/provider";
import MessageBus from '@franklin-figma/messages';
import { observer } from '@franklin-figma/mobx-preact-lite';

import type { FunctionalComponent } from "preact";

import Preview from '@spectrum-icons/workflow/Preview';
import Copy from '@spectrum-icons/workflow/Copy';
import Edit from '@spectrum-icons/workflow/Edit';
import Gears from '@spectrum-icons/workflow/GearsEdit';

import nodeToHTML from "src/util/node2html";
import {WizardId} from "../views/Wizard";
import ViewId from "./ids";

const EditorView: FunctionalComponent = observer(() => {
  const store = useRootStore();
  const { selectionStore: selection } = store;
  useEffect(() => {
    (async () => {
      await selection.enable();
      store.setViewReady(true);
    })().catch(e => console.error('[ui/views/Menu] failed to init: ', e));
  }, []);

  const copy = async () => {
    console.log('[ui/views/Menu] todo copy');
    if(store.selectionStore.nodes.length !== 1) {
      MessageBus.api.backend.toast('exactly one node must be selected');
      return;
    }
    const [first] = store.selectionStore.nodes;
    const html = await nodeToHTML(first);
    try {
    await navigator.clipboard.writeText(html);
    } catch {
      // @ts-ignore
      if (window.copy) {
        console.warn('using window.copy!');
        // @ts-ignore
        window.copy(value);
      } else {
        console.warn('using execCommand copy!');
        // const area = document.createElement('textarea');
        const area = document.createElement('div');
        area.innerHTML = 'hiiiii';
        area.contentEditable = 'true';
        document.body.appendChild(area);
        // area.value = html;
        area.focus();
        // area.select();
        const result = document.execCommand('copy');
        console.log('result: ', result);
        document.body.removeChild(area);
        if (!result) {
          throw new Error();
        }
      }
    }
    // console.log('clipboard: ', await navigator.clipboard.read());
    // navigator.clipboard.write()
  }

  const editor = () => {
    store.setViewType(ViewId.Editor);
  }

  const setupLibrary = () => {
    store.openWizard(WizardId.setupLibrary);
  }

  return(
    <Flex marginY={10} direction="column">
      <ButtonGroup marginY={10}>
        <Button onPress={copy} variant="cta" isDisabled={selection.nodes.length !== 1}>
          <Copy />
          <Text>Copy</Text>
        </Button>
        <Button onPress={editor} variant="primary" isDisabled={selection.nodes.length !== 1}>
          <Preview />
          <Text>Editor</Text>
        </Button>
      </ButtonGroup>

      <Text>{selection.nodes.length < 1 && 'Select a node...'}</Text>

      <Divider size="S" marginY={20} />

      <Flex marginY={10} direction="column">
        <Button onPress={setupLibrary} variant="secondary">
          <Gears />
          <Text>Setup Library</Text>
        </Button>
      </Flex>
    </Flex>
  );
});

export default EditorView;