import { useEffect } from "preact/hooks";
import { Button, ButtonGroup, Text, Flex } from '@adobe/react-spectrum';
import { useRootStore } from "../state/provider";
import MessageBus from '@franklin-figma/messages';
import { observer } from '@franklin-figma/mobx-preact-lite';

import type { FunctionalComponent } from "preact";

import Preview from '@spectrum-icons/workflow/Preview';
import Copy from '@spectrum-icons/workflow/Copy';
import Edit from '@spectrum-icons/workflow/Edit';

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

  const copy = () => {
    console.log('[ui/views/Menu] todo copy');
  }

  const editor = () => {
    store.setViewType(ViewId.Editor);
  }

  const setupLibrary = () => {
    store.openWizard(WizardId.setupLibrary);
  }

  return(
    <Flex margin={10} direction="column">
      <ButtonGroup margin={10}>
        <Button onPress={copy} variant="cta" isDisabled={!selection.nodes.length}>
          <Copy />
          <Text>Copy</Text>
        </Button>
        <Button onPress={editor} variant="primary" isDisabled={!selection.nodes.length}>
          <Preview />
          <Text>Editor</Text>
        </Button>
      </ButtonGroup>

      <Button onPress={setupLibrary} variant="secondary" isDisabled={!!selection.nodes.length}>
        <Edit />
        <Text>Setup Library</Text>
      </Button>

      <Text>{!selection.nodes.length && <p>Select a node...</p>}</Text>
    </Flex>
  );
});

export default EditorView;