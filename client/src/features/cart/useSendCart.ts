import { useMemo, useRef } from 'react';
import { unitTotal, type AddItemLine, type ProductDTO } from '@toscana/shared';
import { useAddItemsMutation } from '../../api/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { errorMessage } from '../../lib/errors';
import { useProductMap } from '../../lib/hooks';
import { newId } from '../../lib/id';
import { pushToast } from '../toast/toastSlice';
import { clearTable, selectCartLines, type CartLine } from './cartSlice';

/** Aynı ürün + aynı ekstralar + aynı not tek satıra birleşir. */
function mergeLines(lines: CartLine[]): AddItemLine[] {
  const merged = new Map<string, AddItemLine>();
  for (const line of lines) {
    const modifierIds = [...line.modifierIds].sort((a, b) => a - b);
    const note = line.note.trim();
    const key = `${line.productId}|${modifierIds.join(',')}|${note.toLocaleLowerCase('tr')}`;
    const existing = merged.get(key);
    if (existing) existing.quantity = Math.min(99, existing.quantity + line.quantity);
    else merged.set(key, { productId: line.productId, quantity: line.quantity, modifierIds, note: note || null });
  }
  return [...merged.values()];
}

export function cartLineTotal(line: CartLine, product: ProductDTO | undefined): number {
  if (!product) return 0;
  const modifiers = product.modifiers.filter((m) => line.modifierIds.includes(m.id));
  return unitTotal(product.price, modifiers) * line.quantity;
}

export function useSendCart(tableId: number) {
  const dispatch = useAppDispatch();
  const lines = useAppSelector((state) => selectCartLines(state, tableId));
  const connection = useAppSelector((state) => state.connection.status);
  const products = useProductMap();
  const [addItems, { isLoading }] = useAddItemsMutation();

  // Wi-Fi takılıp istek tekrarlanırsa aynı kimlik gider; sunucu ikinci kartı açmaz.
  const requestId = useRef<{ id: string; signature: string } | null>(null);

  const signature = useMemo(
    () => JSON.stringify(lines.map((l) => [l.productId, l.quantity, l.modifierIds, l.note])),
    [lines],
  );

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + cartLineTotal(line, products.get(line.productId)), 0);
  const unavailable = lines.filter((line) => products.get(line.productId)?.isAvailable === false);

  async function send(): Promise<boolean> {
    if (lines.length === 0 || isLoading) return false;
    if (unavailable.length > 0) {
      const names = unavailable.map((line) => products.get(line.productId)?.name ?? '').join(', ');
      dispatch(pushToast(`Tükenen ürünü sepetten çıkarın: ${names}`, 'error'));
      return false;
    }
    if (!requestId.current || requestId.current.signature !== signature) {
      requestId.current = { id: newId(), signature };
    }
    try {
      await addItems({ tableId, clientRequestId: requestId.current.id, items: mergeLines(lines) }).unwrap();
      requestId.current = null;
      dispatch(clearTable({ tableId }));
      dispatch(pushToast('Sipariş mutfağa gönderildi', 'success'));
      return true;
    } catch (error) {
      dispatch(pushToast(errorMessage(error), 'error'));
      return false;
    }
  }

  return {
    lines,
    itemCount,
    total,
    send,
    sending: isLoading,
    canSend: lines.length > 0 && !isLoading && connection !== 'offline',
  };
}
