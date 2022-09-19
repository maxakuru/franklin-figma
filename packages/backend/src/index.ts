import figmaHandler from './figma';
import figjamHandler from './figjam';

const HANDLERS = {
  'figma': figmaHandler,
  'figjam': figjamHandler
}

const handler = HANDLERS[figma.editorType];

if (handler) {
  handler();
}


