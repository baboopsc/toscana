import { Outlet } from 'react-router';
import { useAppSelector } from '../app/hooks';
import { ConnectionBanner, ConnectionDot } from '../components/ui/Connection';
import { Wordmark } from '../components/Wordmark';
import { useLogout } from '../lib/hooks';

/** Garson: telefon genişliğinde tek sütun, açık zemin. */
export function WaiterLayout() {
  const staff = useAppSelector((state) => state.auth.staff);
  const logout = useLogout();

  return (
    <div className="min-h-dvh bg-neutral-100">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-neutral-50 shadow-sm">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur">
          <Wordmark size="sm" />
          <div className="flex items-center gap-3">
            <ConnectionDot />
            <span className="max-w-28 truncate text-sm font-medium">{staff?.name}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
            >
              Çıkış
            </button>
          </div>
        </header>
        <ConnectionBanner />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
