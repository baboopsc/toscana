import clsx from 'clsx';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useAppSelector } from '../app/hooks';
import { ConnectionBanner, ConnectionDot } from '../components/ui/Connection';
import { Wordmark } from '../components/Wordmark';
import { useLogout } from '../lib/hooks';
import { ConnectDevicesDialog } from '../pages/kasa/ConnectDevicesDialog';

function navClass({ isActive }: { isActive: boolean }) {
  return clsx(
    'rounded-lg px-3 py-2 text-[15px] font-medium transition-colors',
    isActive ? 'bg-ink text-cream' : 'text-ink hover:bg-ink/5',
  );
}

/** Kasa: masaüstü/tablet, üstte gezinme, altta sayfa içeriği (masa ekranında sağda adisyon). */
export function CashierLayout() {
  const staff = useAppSelector((state) => state.auth.staff);
  const logout = useLogout();
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col bg-cream print:h-auto print:bg-white">
      <header className="flex h-16 shrink-0 items-center gap-6 border-b border-line bg-paper px-5 print:hidden">
        <Wordmark size="sm" />
        <nav className="flex items-center gap-1" aria-label="Kasa">
          <NavLink to="/kasa" end className={navClass}>
            Masa planı
          </NavLink>
          <NavLink to="/kasa/rapor" className={navClass}>
            Gün sonu
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-cream"
          >
            Telefon bağla
          </button>
          <ConnectionDot />
          <span className="text-sm font-medium">{staff?.name}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Çıkış
          </button>
        </div>
      </header>
      <ConnectionBanner />
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
      <ConnectDevicesDialog open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}
