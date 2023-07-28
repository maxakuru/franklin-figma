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

  const editor = () => {
    store.setViewType(ViewId.Editor);
  }

  const setupLibrary = () => {
    store.openWizard(WizardId.setupLibrary);
  }

  return(
    <Flex marginY={20} direction="column">
      <Button onPress={editor} variant="cta" isDisabled={selection.nodes.length !== 1}>
        <Preview />
        <Text>Editor</Text>
      </Button>

      <Text>{selection.nodes.length < 1 && 'Select a node...'}</Text>

      <Divider size="S" marginY={20} />

      <Button onPress={setupLibrary} variant="secondary">
        <Gears />
        <Text>Setup Library</Text>
      </Button>
    </Flex>
  );
});

export default EditorView;