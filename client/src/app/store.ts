import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '../api/api';
import authReducer, { AUTH_STORAGE_KEY } from '../features/auth/authSlice';
import cartReducer, { CART_STORAGE_KEY } from '../features/cart/cartSlice';
import cashierReducer from '../features/cashier/cashierSlice';
import connectionReducer from '../features/connection/connectionSlice';
import toastReducer from '../features/toast/toastSlice';
import { writeJSON } from '../lib/storage';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
    cashier: cashierReducer,
    connection: connectionReducer,
    toast: toastReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

// Oturum ve sepet değiştikçe localStorage'a yaz.
let lastAuth = store.getState().auth;
let lastCart = store.getState().cart;
store.subscribe(() => {
  const { auth, cart } = store.getState();
  if (auth !== lastAuth) {
    lastAuth = auth;
    writeJSON(AUTH_STORAGE_KEY, auth.token ? auth : null);
  }
  if (cart !== lastCart) {
    lastCart = cart;
    writeJSON(CART_STORAGE_KEY, cart);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
