import figmaHandler from './figma';
import figjamHandler from './figjam';
import { wrapCommon } from './common';

const HANDLERS = {
  'figma': wrapCommon(figmaHandler),
  'figjam': wrapCommon(figjamHandler)
}

const handler = HANDLERS[figma.editorType];

if (handler) {
  handler();
}


