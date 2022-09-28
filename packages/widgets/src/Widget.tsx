import MessageBus from '@franklin-figma/messages';
import { Button } from './components';
import { findAncestor, sleep } from './utils';
import GridIcon from './assets/icons/grid';
import SettingsIcon from './assets/icons/settings';
import PreviewIcon from './assets/icons/preview';



const { widget } = figma;
const { 
  useEffect,
  AutoLayout, 
  Line,
  useSyncedState, 
  useWidgetId, 
  usePropertyMenu,
  Text
} = widget;

export default function Widget() {
  const widgetId = useWidgetId();
  const [nodeId, _] = useSyncedState<string>("nodeId", undefined);
  const [nodeType, __] = useSyncedState<'PAGE'|'FORM'>("nodeType", undefined);

  const recenter = () => {
    const widgetNode = figma.getNodeById(widgetId) as WidgetNode;
    const rootNode = figma.getNodeById(nodeId) as SceneNode;
    widgetNode.x = rootNode.x + rootNode.width/2 - widgetNode.width/2;
    widgetNode.y = rootNode.y + rootNode.height;
  }

  if(nodeId) {
    usePropertyMenu(
      [
        {
          tooltip: 'Recenter',
          propertyName: 'recenter',
          itemType: 'action',
          icon: GridIcon("#fff")
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
    if(typeof nodeId === 'string') {
      recenter();
    }
  });

  const setupPages = async () => {
    const widgetNode = figma.getNodeById(widgetId) as WidgetNode;
    figma.currentPage.selection.forEach((node) => {
      const frame = findAncestor(node, (n => n.type === 'FRAME'));
      widgetNode.cloneWidget({nodeId: frame.id, nodeType: 'PAGE'});
    });
    widgetNode.remove();
  }

  const setupForms = () => {

  }

  const configure = () => {
    figma.showUI(__uiFiles__['ui']);
    const remove = MessageBus.on('ui:ready', () => {
      console.log('ui ready!');
      MessageBus.send('ui:init', { nodeId, nodeType, uiType: 'config' });
      remove();
    });
    return new Promise((resolve) => undefined);
  }

  const preview = () => {

  }

  return (
    <AutoLayout 
      direction={'vertical'}
      width={370}
    >
      {
        nodeId ? 
        <AutoLayout 
          horizontalAlignItems={'center'} 
          direction={'vertical'}
          width={'fill-parent'}>
          <Line 
            strokeDashPattern={[3]}
            stroke={{ r: 1, g: 1, b: 1, a: 0.5 }}
            rotation={90}
            length={30}/>
            <AutoLayout 
              fill={"#fff"} 
              padding={20} 
              spacing={12}
              cornerRadius={20}
              direction={'vertical'}
              width={'fill-parent'}
              horizontalAlignItems='start'>
              <Text fill={'#a0a0a0'}>AEM Franklin - {nodeType === 'FORM' ? 'Form' : 'Page'}</Text>
              <AutoLayout
                width={'fill-parent'}
                direction={'vertical'}
                spacing={8}
                horizontalAlignItems='center'>
                <Button variant='cta' icon={PreviewIcon} onClick={preview}>Preview</Button>
                <Button variant='secondary' icon={SettingsIcon} onClick={configure}>Configure</Button>
              </AutoLayout>

          </AutoLayout>
        </AutoLayout>
        :
        <AutoLayout 
          fill={"#fff"} 
          padding={20} 
          spacing={8}
          cornerRadius={20}
          direction={'vertical'}
          width={'fill-parent'}>
            <Button onClick={setupPages}>Create page</Button>
            <Button onClick={setupForms}>Create form</Button>
        </AutoLayout>
      }
    </AutoLayout>
  )
}