/**
 * src/main.js — React application entry point.
 *
 * Mounts the <App /> component into the #root div defined in index.html.
 * StrictMode is enabled for catching common mistakes during development.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
