import './setup'; // must be first

import { render } from 'preact';
import Provider from './Provider';
import App from './App';

const root = document.getElementById('app');

render( 
  <Provider>
    <App />
  </Provider>,
  root
);
