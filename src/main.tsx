import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './AppShell';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </StrictMode>,
);
