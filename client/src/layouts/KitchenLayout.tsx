import { useState } from 'react';
import { Outlet } from 'react-router';
import { useGetTicketsQuery } from '../api/api';
import { Button } from '../components/ui/Button';
import { ConnectionBanner, ConnectionDot } from '../components/ui/Connection';
import { Wordmark } from '../components/Wordmark';
import { formatTime } from '../lib/format';
import { useLogout, useNow } from '../lib/hooks';
import { unlockAudio } from '../lib/sound';

function StartOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-ink px-6 text-center text-cream">
      <Wordmark size="lg" tone="light" />
      <p className="max-w-md text-lg text-cream/80">
        Yeni siparişlerde zil çalması ve ekranın tam ekran açılması için bir kez dokunun.
      </p>
      <Button size="xl" variant="success" onClick={onStart} className="min-w-64">
        Ekranı başlat
      </Button>
    </div>
  );
}

/** Mutfak: yatay ekran, koyu başlık, kart panosu. */
export function KitchenLayout() {
  const logout = useLogout();
  const now = useNow(15_000);
  const { data: tickets } = useGetTicketsQuery(undefined, { pollingInterval: 60_000 });
  const [started, setStarted] = useState(false);

  function start() {
    unlockAudio();
    try {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    } catch {
      // tam ekran desteklenmiyorsa geç
    }
    setStarted(true);
  }

  const count = tickets?.length ?? 0;

  return (
    <div className="flex h-dvh select-none flex-col bg-stone-200">
      <header className="flex h-16 shrink-0 items-center gap-6 bg-ink px-6 text-cream">
        <Wordmark size="sm" tone="light" />
        <p className="text-lg">
          {count === 0 ? 'Bekleyen sipariş yok' : <><span className="font-semibold tabular-nums">{count}</span> sipariş bekliyor</>}
        </p>
        <div className="ml-auto flex items-center gap-5">
          <span className="text-2xl font-semibold tabular-nums">{formatTime(new Date(now).toISOString())}</span>
          <ConnectionDot />
          <button type="button" onClick={logout} className="rounded-lg px-3 py-2 text-sm text-cream/70 hover:bg-white/10">
            Çıkış
          </button>
        </div>
      </header>
      <ConnectionBanner />
      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <Outlet />
      </main>
      {started ? null : <StartOverlay onStart={start} />}
    </div>
  );
}
