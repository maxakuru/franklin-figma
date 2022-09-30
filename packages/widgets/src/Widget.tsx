import MessageBus, { AnyFunc } from '@franklin-figma/messages';
import { spawn } from '@franklin-figma/ui-worker';

import { Button } from './components';
import { findAncestor, clamp } from './utils';
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
  Text,
  waitForTask
} = widget;

export default function Widget() {
  const widgetId = useWidgetId();
  const [nodeId, _] = useSyncedState<string>("nodeId", undefined);
  const [lock, setLock] = useSyncedState<false | 'initializing' | 'previewing' | 'configuring'>("lock", false);
  const [nodeType, __] = useSyncedState<'PAGE'|'FORM'>("nodeType", undefined);

  const recenter = () => {
    const widgetNode = figma.getNodeById(widgetId) as WidgetNode;
    const rootNode = figma.getNodeById(nodeId) as SceneNode;
    widgetNode.x = rootNode.x + rootNode.width/2 - widgetNode.width/2;
    widgetNode.y = rootNode.y + rootNode.height;
  }

  const lockGuard = <T extends AnyFunc>(fn: T): T => {
    return ((...args) => {
      if(lock) {
        figma.notify(`Someone is already ${lock} this ${nodeType.toLowerCase()}.`, { error: true });
      } else {
        return fn.apply(null, args)
      }
    }) as T;
  }

  const openSettings = () => {
    const { bounds, zoom } = figma.viewport;
    const height = Math.round(clamp(bounds.height * zoom * 0.4, 600, 1080));
    const width = Math.round(clamp(bounds.width * zoom * 0.4, 1000, 1920));
    const x = Math.round(bounds.x * zoom + (bounds.width * zoom - width)/2) * 1/zoom;
    const y = Math.round(bounds.y * zoom + (bounds.height * zoom - height)/2) * 1/zoom;

    figma.showUI(__uiFiles__['ui'], {
      title: `Settings (AEM Franklin)`,
      position: {
        x,
        y
      },
      height,
      width,
      themeColors: true
    });
    MessageBus.once('ui:ready', () => {
      MessageBus.send('ui:init', { nodeId, nodeType, uiType: 'settings' });
    });

    return new Promise<void>((resolve) => undefined);
  }

  /**
   * Setup initial document settings
   */
  const introDoc = lockGuard(async () => {
    console.log('introDoc...');

    setLock('initializing');
    setLock(false);
  });

  /**
   * Setup initial user settings
   * Does not lock the document, since it doesn't result in changes to doc itself
   */
  const introUser = async () => {
    console.log('introUser...');
  }

  const menuItems: WidgetPropertyMenuItem[] = [
    {
      tooltip: 'Settings',
      propertyName: 'settings',
      itemType: 'action',
      icon: SettingsIcon("#fff")
    }
  ];

  if(nodeId) {
    menuItems.push({
      itemType: 'separator'
    }, {
      tooltip: 'Recenter',
      propertyName: 'recenter',
      itemType: 'action',
      icon: GridIcon("#fff")
    });
  }

  usePropertyMenu(
    menuItems,
    (e) => {
      switch(e.propertyName) {
        case 'recenter':
          return recenter();
        case 'settings':
          return openSettings();
        default:
          console.warn('[Widget] Unhandled widget property event: ', e);
      }
    }
  );

  useEffect(() => {    
    if(typeof nodeId === 'string') {
      recenter();
    } else {
        // if it's the first time using the widget, open settings for them automatically
        waitForTask((async() => {
          const newUser = await figma.clientStorage.getAsync('new_user');
          if(typeof newUser === 'undefined') {
            // setup new user
            await introUser();
            await figma.clientStorage.setAsync('new_document', false);
          }

          const doc = figma.currentPage;
          const newDoc = doc.getPluginData('new_document');
          if(typeof newDoc === 'undefined') {
            // setup new document
            await introDoc();
            doc.setPluginData('new_document', '"false"');
          }          
        })());
    }

    MessageBus.once('ui:close', () => {
      console.log('[Widget] UI closed, no longer configuring.');
      setLock(false);
    });
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

  const configure = lockGuard(() => {
    setLock('configuring');
    const widgetNode = figma.getNodeById(widgetId) as WidgetNode;
    const focusNode = figma.getNodeById(nodeId) as SceneNode;
    figma.viewport.scrollAndZoomIntoView([focusNode, widgetNode]);
    const { bounds, zoom } = figma.viewport;
    const height = Math.round(clamp(bounds.height * zoom * 0.6, 700, 1080));
    const width = Math.round(clamp(bounds.width * zoom * 0.3, 300, 700));

    figma.showUI(__uiFiles__['ui'], {
      title: `Configure ${nodeType === 'FORM' ? 'form' : 'page'} (AEM Franklin)`,
      position: { 
        x: focusNode.x + focusNode.width + 10, 
        y: focusNode.y
      },
      width, 
      height,
      themeColors: true
    });
    MessageBus.once('ui:ready', () => {
      MessageBus.send('ui:init', { nodeId, nodeType, uiType: 'config' });
    });

    return new Promise((resolve) => undefined);
  });

  const preview = lockGuard(() => {
    setLock('previewing');
    setLock(false);
  });

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
              <Text fill={'#a0a0a0'}>{nodeType === 'FORM' ? 'Form' : 'Page'}</Text>
              <AutoLayout
                width={'fill-parent'}
                direction={'vertical'}
                spacing={8}
                horizontalAlignItems='center'>
                <Button variant='cta' disabled={!!lock} icon={PreviewIcon} onClick={preview}>Preview</Button>
                <Button variant='primary' disabled={!!lock} icon={SettingsIcon} onClick={configure}>Configure</Button>
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