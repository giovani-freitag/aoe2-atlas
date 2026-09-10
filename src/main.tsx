import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createI18n } from './i18n/index.ts';
import { App } from './react/app.tsx';
import './index.css';

createI18n();

const container = document.getElementById('root');
if (!container) throw new Error('The #root container is missing from index.html.');

// The bundles for the reader's language arrive as their own chunk; the mark in index.html
// stands until they do, so the fallback here has nothing to add.
createRoot(container).render(
    <StrictMode>
        <Suspense fallback={null}>
            <App />
        </Suspense>
    </StrictMode>,
);
