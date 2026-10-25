import '@fontsource-variable/inter';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';
import { store } from './app/store';
import { router } from './router';

const container = document.getElementById('root');
if (!container) throw new Error('#root bulunamadı');

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
