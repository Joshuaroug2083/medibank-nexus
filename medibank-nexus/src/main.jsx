import React from 'react';
import ReactDOM from 'react-dom/client';
import './env.js';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
