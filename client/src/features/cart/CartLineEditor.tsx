import clsx from 'clsx';
import type { ProductDTO } from '@toscana/shared';
import { useAppDispatch } from '../../app/hooks';
import { Stepper } from '../../components/ui/Stepper';
import { formatTL } from '../../lib/format';
import { noteHasTag, setNote, setQuantity, toggleModifier, toggleNoteTag, type CartLine } from './cartSlice';

interface CartLineEditorProps {
  tableId: number;
  line: CartLine;
  product: ProductDTO;
  quickNotes: string[];
  showStepper: boolean;
  compact?: boolean;
}

/** Bir sepet satırının ekstraları ve notu ("Add Notes"). */
export function CartLineEditor({ tableId, line, product, quickNotes, showStepper, compact = false }: CartLineEditorProps) {
  const dispatch = useAppDispatch();

  return (
    <div className={clsx('flex flex-col gap-2 rounded-lg bg-paper ring-1 ring-line', compact ? 'p-2' : 'p-3')}>
      {showStepper ? (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-soft">Ayrı satır</span>
          <Stepper
            size="md"
            label={product.name}
            value={line.quantity}
            onIncrement={() => dispatch(setQuantity({ tableId, key: line.key, quantity: line.quantity + 1 }))}
            onDecrement={() => dispatch(setQuantity({ tableId, key: line.key, quantity: line.quantity - 1 }))}
          />
        </div>
      ) : null}

      {product.modifiers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {product.modifiers.map((modifier) => {
            const on = line.modifierIds.includes(modifier.id);
            return (
              <button
                key={modifier.id}
                type="button"
                aria-pressed={on}
                onClick={() => dispatch(toggleModifier({ tableId, key: line.key, modifierId: modifier.id }))}
                className={clsx(
                  'h-9 rounded-full border px-3 text-sm font-semibold transition-colors',
                  on ? 'border-olive bg-olive text-white' : 'border-olive/40 bg-white text-olive',
                )}
              >
                {on ? '✓ ' : '+ '}
                {modifier.name.replace(/\s*\(Ekstra\)\s*/i, '')} {formatTL(modifier.price)}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {quickNotes.map((tag) => {
          const on = noteHasTag(line.note, tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => dispatch(setNote({ tableId, key: line.key, note: toggleNoteTag(line.note, tag) }))}
              className={clsx(
                'h-8 rounded-full border px-3 text-[13px] font-medium transition-colors',
                on ? 'border-amber bg-amber-soft text-amber' : 'border-line bg-white text-ink-soft',
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={line.note}
        maxLength={120}
        onChange={(event) => dispatch(setNote({ tableId, key: line.key, note: event.target.value }))}
        placeholder="Not ekle (ör. ekmek istemiyor)"
        aria-label={`${product.name} notu`}
        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-base placeholder:text-ink-soft/70 focus:border-ink focus:outline-none"
      />
    </div>
  );
}
