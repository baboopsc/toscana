import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Kasa ekranı: ödeme için işaretlenen kalemler ve "Tükendi düzenle" modu.

export interface CashierState {
  tableId: number | null;
  selected: Record<string, number>; // orderItemId → seçilen adet
  availabilityMode: boolean;
}

const initialState: CashierState = { tableId: null, selected: {}, availabilityMode: false };

const cashierSlice = createSlice({
  name: 'cashier',
  initialState,
  reducers: {
    openTable(state, action: PayloadAction<number>) {
      if (state.tableId !== action.payload) {
        state.tableId = action.payload;
        state.selected = {};
      }
    },
    toggleItem(state, action: PayloadAction<{ itemId: number; unpaid: number }>) {
      const key = String(action.payload.itemId);
      if (state.selected[key]) delete state.selected[key];
      else state.selected[key] = action.payload.unpaid;
    },
    setItemQuantity(state, action: PayloadAction<{ itemId: number; quantity: number }>) {
      const key = String(action.payload.itemId);
      if (action.payload.quantity <= 0) delete state.selected[key];
      else state.selected[key] = action.payload.quantity;
    },
    clearSelection(state) {
      state.selected = {};
    },
    setAvailabilityMode(state, action: PayloadAction<boolean>) {
      state.availabilityMode = action.payload;
    },
  },
});

export const { openTable, toggleItem, setItemQuantity, clearSelection, setAvailabilityMode } = cashierSlice.actions;
export default cashierSlice.reducer;
