import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Import Tailwind base styles.  This file includes the Tailwind directives
// (`@tailwind base;`, etc.) and any global styles.  Without this import,
// the Tailwind classes used in App.jsx will not be applied.
import './index.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);
