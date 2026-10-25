import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { newId } from '../../lib/id';
import { readJSON } from '../../lib/storage';

// Gönderilmemiş sipariş satırları, masa başına. Telefon kilitlense ya da sayfa
// yenilense de kaybolmasın diye localStorage'a yazılır.

export const CART_STORAGE_KEY = 'toscana.cart';

export interface CartLine {
  key: string;
  productId: number;
  quantity: number;
  modifierIds: number[];
  note: string;
}

export interface CartState {
  byTable: Record<string, CartLine[]>;
}

const MAX_QTY = 99;

function loadCart(): CartState {
  const saved = readJSON<CartState | null>(CART_STORAGE_KEY, null);
  return saved && typeof saved.byTable === 'object' && saved.byTable !== null ? saved : { byTable: {} };
}

function linesOf(state: CartState, tableId: number): CartLine[] {
  const key = String(tableId);
  if (!state.byTable[key]) state.byTable[key] = [];
  return state.byTable[key];
}

function cleanup(state: CartState, tableId: number) {
  const key = String(tableId);
  if (state.byTable[key]?.length === 0) delete state.byTable[key];
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCart(),
  reducers: {
    /** Ürünün ilk satırının adedini 1 artırır; satır yoksa yeni satır açar. */
    incrementProduct: {
      reducer(state, action: PayloadAction<{ tableId: number; productId: number; key: string }>) {
        const { tableId, productId, key } = action.payload;
        const lines = linesOf(state, tableId);
        const line = lines.find((l) => l.productId === productId);
        if (line) line.quantity = Math.min(MAX_QTY, line.quantity + 1);
        else lines.push({ key, productId, quantity: 1, modifierIds: [], note: '' });
      },
      prepare(payload: { tableId: number; productId: number }) {
        return { payload: { ...payload, key: newId() } };
      },
    },
    /** Aynı ürün için ayrı satır açar (farklı not veya ekstra için). */
    addLine: {
      reducer(state, action: PayloadAction<{ tableId: number; productId: number; key: string }>) {
        const { tableId, productId, key } = action.payload;
        linesOf(state, tableId).push({ key, productId, quantity: 1, modifierIds: [], note: '' });
      },
      prepare(payload: { tableId: number; productId: number }) {
        return { payload: { ...payload, key: newId() } };
      },
    },
    setQuantity(state, action: PayloadAction<{ tableId: number; key: string; quantity: number }>) {
      const { tableId, key, quantity } = action.payload;
      const lines = linesOf(state, tableId);
      const index = lines.findIndex((l) => l.key === key);
      if (index === -1) return;
      if (quantity <= 0) lines.splice(index, 1);
      else lines[index].quantity = Math.min(MAX_QTY, quantity);
      cleanup(state, tableId);
    },
    toggleModifier(state, action: PayloadAction<{ tableId: number; key: string; modifierId: number }>) {
      const { tableId, key, modifierId } = action.payload;
      const line = linesOf(state, tableId).find((l) => l.key === key);
      if (!line) return;
      line.modifierIds = line.modifierIds.includes(modifierId)
        ? line.modifierIds.filter((id) => id !== modifierId)
        : [...line.modifierIds, modifierId].sort((a, b) => a - b);
    },
    setNote(state, action: PayloadAction<{ tableId: number; key: string; note: string }>) {
      const { tableId, key, note } = action.payload;
      const line = linesOf(state, tableId).find((l) => l.key === key);
      if (line) line.note = note.slice(0, 120);
    },
    clearTable(state, action: PayloadAction<{ tableId: number }>) {
      delete state.byTable[String(action.payload.tableId)];
    },
  },
});

export const { incrementProduct, addLine, setQuantity, toggleModifier, setNote, clearTable } = cartSlice.actions;
export default cartSlice.reducer;

const EMPTY: CartLine[] = [];

export function selectCartLines(state: { cart: CartState }, tableId: number): CartLine[] {
  return state.cart.byTable[String(tableId)] ?? EMPTY;
}

/** Not içindeki hazır etiketleri aç/kapat: "Buzsuz, Limonlu" */
export function toggleNoteTag(note: string, tag: string): string {
  const parts = note
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const exists = parts.some((p) => p.toLocaleLowerCase('tr') === tag.toLocaleLowerCase('tr'));
  const next = exists ? parts.filter((p) => p.toLocaleLowerCase('tr') !== tag.toLocaleLowerCase('tr')) : [...parts, tag];
  return next.join(', ');
}

export function noteHasTag(note: string, tag: string): boolean {
  return note
    .split(',')
    .map((p) => p.trim().toLocaleLowerCase('tr'))
    .includes(tag.toLocaleLowerCase('tr'));
}
