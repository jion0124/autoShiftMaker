import React from 'react';
import { createRoot } from 'react-dom/client'; // createRootをインポート
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// createRootを使用してReactアプリケーションをレンダリング
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
