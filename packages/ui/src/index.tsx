import './setup'; // must be first

import React from 'react';
import { createRoot } from 'react-dom/client';

import Provider from './Provider';
import App from './App';

const container = document.getElementById('app');
const root = createRoot(container);
root.render( 
  <Provider>
    <App />
  </Provider>
);