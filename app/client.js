import React from 'react';
import { render } from 'react-dom';
import Menu from './components/Menu';

// window.React = React;

alert('bundle loaded, Rendering in browser. UI already server-rendered before alert');

render(
  <Menu recipes={window.__DATA__} />,
  document.getElementById('app')
);

alert('render complete');