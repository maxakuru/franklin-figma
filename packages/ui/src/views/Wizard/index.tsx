import MessageBus from '@franklin-figma/messages';
import { useRootStore } from "../../state/provider";
import { observer } from '@franklin-figma/mobx-preact-lite';
import wizards from './wizards';

import { Fragment } from "preact";

export * from './wizards';

const WizardView: React.FC = observer(() => {
  const store = useRootStore();
  const Component = wizards[store.wizardId];
  return(<>
      {Component && <Component/>}
  </>)
});

export default WizardView;