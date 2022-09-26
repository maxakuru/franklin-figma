import MessageBus from '@franklin-figma/messages';
import { Button } from './components';
import { findAncestor, sleep } from './utils';
import GridIcon from './assets/grid.svg';

const { widget } = figma;
const { 
  useEffect,
  AutoLayout, 
  useSyncedState, 
  useWidgetId, 
  usePropertyMenu,
} = widget;

export default function Widget({
  id,
  type
}: {id?: string; type?: string;} = {}) {
  const widgetId = useWidgetId();
  const [nodeId, setNodeId] = useSyncedState("nodeId", id);
  const [nodeType, setNodeType] = useSyncedState("nodeType", type);

  const recenter = () => {
    const widgetNode = figma.getNodeById(widgetId) as WidgetNode;
    const rootNode = figma.getNodeById(nodeId) as SceneNode;
    widgetNode.x = rootNode.x + rootNode.width/2 - widgetNode.width/2;
    widgetNode.y = rootNode.y + rootNode.height + 10;
  }

  if(nodeId) {
    usePropertyMenu(
      [
        {
          tooltip: 'Recenter',
          propertyName: 'recenter',
          itemType: 'action',
          icon: GridIcon
        }
      ],
      (e) => {
        if(e.propertyName === 'recenter') {
          recenter();
        }
      },
    )
  }

  useEffect(() => {
    MessageBus.on('*', (type, msg) => {
      console.log('[widget] message: ', type, msg);
    });
    
    if(typeof nodeId === 'string') {
      recenter();
    }
  });

  const setupPages = async () => {
    console.log('setupPages() ', widgetId);
    const widgetNode = figma.getNodeById(widgetId) as WidgetNode;
    console.log('setuppages length: ', figma.currentPage.selection.length, widgetNode);
    figma.currentPage.selection.forEach((node) => {
      const frame = findAncestor(node, (n => n.type === 'FRAME'));
      console.log('frame: ', frame);
      widgetNode.cloneWidget({nodeId: frame.id, nodeType: 'PAGE'});
    });
    console.log('setupPages() sleeping ', Date.now());

    await sleep(10000);
    console.log('setupPages() done sleep ', Date.now());

  }

  const setupForms = () => {

  }

  const configure = () => {

  }

  return (
    <AutoLayout 
      fill={"#fff"} 
      padding={20} 
      spacing={8}
      cornerRadius={20}
      direction={'vertical'}
    >
      {
        nodeId ? 
        <Button onClick={configure}>Configure</Button>
        :
        <>
          <Button onClick={setupPages}>Create page</Button>
          <Button onClick={setupForms}>Create form</Button>
        </>
      }
    </AutoLayout>
  )
}