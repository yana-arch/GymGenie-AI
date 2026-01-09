import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { StorageService } from './services/storage/StorageService';

// Dev Mode Cache Bypass
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('devMode') === 'true' || urlParams.get('fresh') === 'true') {
  StorageService.devPurge();
  // Clear URL params to prevent infinite purge loop on reload
  window.history.replaceState({}, document.title, window.location.pathname);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);