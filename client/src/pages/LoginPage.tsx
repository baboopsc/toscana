import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ROLE_LABELS, type StaffDTO, type StaffRole } from '@toscana/shared';
import { useGetStaffListQuery, useLoginMutation } from '../api/api';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { ErrorState, Loading } from '../components/StateMessage';
import { Wordmark } from '../components/Wordmark';
import { homePathFor, setCredentials } from '../features/auth/authSlice';
import { errorMessage } from '../lib/errors';

const ROLE_ORDER: StaffRole[] = ['WAITER', 'CASHIER', 'KITCHEN', 'ADMIN'];
const PIN_LENGTH = 4;

function PinPad({
  staff,
  onBack,
}: {
  staff: StaffDTO;
  onBack: () => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  const submit = useCallback(
    async (value: string) => {
      try {
        const result = await login({ staffId: staff.id, pin: value }).unwrap();
        dispatch(setCredentials(result));
        navigate(homePathFor(result.staff.role), { replace: true });
      } catch (err) {
        setError(errorMessage(err));
        setPin('');
        setShake((n) => n + 1);
      }
    },
    [dispatch, login, navigate, staff.id],
  );

  const press = useCallback(
    (digit: string) => {
      if (isLoading || pin.length >= PIN_LENGTH) return;
      setError(null);
      const next = pin + digit;
      setPin(next);
      if (next.length === PIN_LENGTH) void submit(next);
    },
    [isLoading, pin, submit],
  );

  const erase = useCallback(() => setPin((current) => current.slice(0, -1)), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (/^\d$/.test(event.key)) press(event.key);
      else if (event.key === 'Backspace') erase();
      else if (event.key === 'Escape') onBack();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [press, erase, onBack]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center">
      <p className="text-ink-soft">{ROLE_LABELS[staff.role]}</p>
      <p className="font-display text-3xl font-semibold">{staff.name}</p>

      <div key={shake} className={clsx('mt-6 flex gap-4', shake > 0 && 'animate-shake')} aria-label={`${pin.length} hane girildi`}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <span
            key={index}
            className={clsx(
              'size-4 rounded-full border-2 border-ink transition-colors',
              index < pin.length ? 'bg-ink' : 'bg-transparent',
            )}
          />
        ))}
      </div>

      <p className="mt-4 min-h-6 text-center text-sm font-medium text-terracotta" role="alert">
        {error ?? (isLoading ? 'Kontrol ediliyor…' : '')}
      </p>

      <div className="mt-2 grid w-full grid-cols-3 gap-3">
        {keys.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => press(digit)}
            className="h-16 rounded-2xl bg-white text-2xl font-semibold shadow-sm ring-1 ring-line hover:bg-paper active:bg-cream"
          >
            {digit}
          </button>
        ))}
        <button type="button" onClick={onBack} className="h-16 rounded-2xl text-base font-medium text-ink-soft hover:bg-white">
          Geri
        </button>
        <button
          type="button"
          onClick={() => press('0')}
          className="h-16 rounded-2xl bg-white text-2xl font-semibold shadow-sm ring-1 ring-line hover:bg-paper active:bg-cream"
        >
          0
        </button>
        <button
          type="button"
          onClick={erase}
          className="h-16 rounded-2xl text-base font-medium text-ink-soft hover:bg-white"
          aria-label="Son haneyi sil"
        >
          Sil
        </button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const current = useAppSelector((state) => state.auth.staff);
  const { data: staffList, isLoading, isError, error, refetch } = useGetStaffListQuery(undefined, {
    skip: Boolean(current),
  });
  const [selected, setSelected] = useState<StaffDTO | null>(null);

  const grouped = useMemo(() => {
    const groups = new Map<StaffRole, StaffDTO[]>();
    for (const person of staffList ?? []) {
      const list = groups.get(person.role) ?? [];
      list.push(person);
      groups.set(person.role, list);
    }
    return ROLE_ORDER.filter((role) => groups.has(role)).map((role) => ({ role, people: groups.get(role) ?? [] }));
  }, [staffList]);

  const back = useCallback(() => setSelected(null), []);

  if (current) return <Navigate to={homePathFor(current.role)} replace />;

  return (
    <div className="min-h-dvh bg-cream px-5 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-10">
        <Wordmark size="lg" />

        {selected ? (
          <PinPad staff={selected} onBack={back} />
        ) : (
          <div className="w-full">
            <h1 className="mb-5 text-center text-lg font-medium text-ink-soft">Giriş yapmak için adınıza dokunun</h1>
            {isLoading ? <Loading /> : null}
            {isError ? <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /> : null}
            <div className="flex flex-col gap-6">
              {grouped.map(({ role, people }) => (
                <section key={role}>
                  <h2 className="mb-2 text-sm font-semibold text-ink-soft">{ROLE_LABELS[role]}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {people.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => setSelected(person)}
                        className="h-16 rounded-xl bg-white px-4 text-left text-lg font-semibold shadow-sm ring-1 ring-line hover:ring-ink/40"
                      >
                        {person.name}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
