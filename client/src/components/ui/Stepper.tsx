import clsx from 'clsx';

interface StepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  max?: number;
  disabled?: boolean;
  size?: 'md' | 'lg';
}

/** Tek elle kullanım için büyük (−) ve (+) butonları. */
export function Stepper({ value, onIncrement, onDecrement, label, max = 99, disabled = false, size = 'lg' }: StepperProps) {
  const button = clsx(
    'grid place-items-center rounded-full text-xl font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-35',
    size === 'lg' ? 'size-11' : 'size-9',
  );

  return (
    <div className="flex items-center gap-1" role="group" aria-label={`${label} adedi`}>
      <button
        type="button"
        className={clsx(button, value > 0 ? 'bg-ink/8 text-ink hover:bg-ink/15' : 'text-ink-soft')}
        onClick={onDecrement}
        disabled={disabled || value <= 0}
        aria-label={`${label} azalt`}
      >
        −
      </button>
      <span
        className={clsx(
          'min-w-7 text-center font-semibold tabular-nums',
          size === 'lg' ? 'text-lg' : 'text-base',
          value === 0 && 'text-ink-soft',
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={clsx(button, 'bg-ink text-cream hover:bg-ink/85')}
        onClick={onIncrement}
        disabled={disabled || value >= max}
        aria-label={`${label} artır`}
      >
        +
      </button>
    </div>
  );
}
