import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Standalone full-page mode: paint the page background dark so the column has
// matching surround on desktop.
document.documentElement.classList.add('gp-standalone');
document.body.classList.add('gp-standalone');

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root in index.html');
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
