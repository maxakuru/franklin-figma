import './setup'; // must be first

import React from 'react';
import App from './App';

console.log('in ui!', globalThis);


import { createRoot } from 'react-dom/client';
const container = document.getElementById('app');
const root = createRoot(container);
root.render( <App />);


// document.getElementById('create').onclick = () => {
//   const textbox = document.getElementById('count') as HTMLInputElement;
//   const count = parseInt(textbox.value, 10);
//   parent.postMessage({ pluginMessage: { type: 'create-shapes', count } }, '*')
// }

// document.getElementById('cancel').onclick = () => {
//   parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*')
// }