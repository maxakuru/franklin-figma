import './setup';
import figmaHandler from './figma';
import figjamHandler from './figjam';
import { wrapCommon } from './common';

const HANDLERS = {
  'figma': wrapCommon(figmaHandler),
  'figjam': wrapCommon(figjamHandler),
  'dev': wrapCommon(figmaHandler),
}

const handler = HANDLERS[figma.editorType];

if (handler) {
  handler();
}


