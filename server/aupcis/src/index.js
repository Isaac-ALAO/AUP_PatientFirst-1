import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import posthog from 'posthog-js';

// Initialize PostHog
posthog.init('YOUR_POSTHOG_API_KEY', { api_host: 'https://app.posthog.com' });

// Identify the user with a unique ID
if (!window.location.host.includes('127.0.0.1') && !window.location.host.includes('localhost')) {
  posthog.init('<ph_project_api_key>', { api_host: 'https://us.i.posthog.com' })
}
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
