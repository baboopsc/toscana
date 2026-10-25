import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { newId } from '../../lib/id';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] as Toast[] },
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.items.push(action.payload);
        if (state.items.length > 4) state.items.shift();
      },
      prepare(message: string, tone: ToastTone = 'info') {
        return { payload: { id: newId(), message, tone } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.items = state.items.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
