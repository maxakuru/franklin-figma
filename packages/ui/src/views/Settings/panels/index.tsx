import * as React from 'react';

import { Panel } from "../../../types";
import { DocumentPanel } from './Document';
import { GlobalPanel } from './Global';
import * as PanelId from './ids';
import { NodePanel } from "./Node";
import { UserPanel } from './User';

export * as PanelId from './ids';

const panels: Panel[] = [
  {
    id: PanelId.Node,
    name: 'Node',
    children: <NodePanel/>,
  },
  {
    id: PanelId.Document,
    name: 'Document',
    children: <DocumentPanel/>,
  },
  {
    id: PanelId.Global,
    name: 'Global',
    children: <GlobalPanel/>,
  },
  {
    id: PanelId.User,
    name: 'User',
    children: <UserPanel/>,
  },
];

export default panels;