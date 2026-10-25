import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useGetAddressesQuery } from '../../api/api';
import { Dialog } from '../../components/ui/Dialog';

/** Garson telefonları ve mutfak ekranı için kasa bilgisayarının yerel ağ adresi ve QR kodu. */
export function ConnectDevicesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, isLoading } = useGetAddressesQuery(undefined, { skip: !open });
  const [qr, setQr] = useState<string | null>(null);

  // Geliştirme modunda (Vite, 5173) telefonlar da 5173'e bağlanmalı.
  const devPort = window.location.port === '5173';
  const withPort = (url: string) => (devPort && url.startsWith('http://') ? url.replace(/:\d+$/, ':5173') : url);
  const urls = (data?.urls ?? []).map(withPort);
  const primary = urls[0];
  const loginUrl = primary ? `${primary}/giris` : null;
  const isPublic = Boolean(primary?.startsWith('https://'));

  useEffect(() => {
    let cancelled = false;
    if (!loginUrl) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(loginUrl, { margin: 1, width: 280, color: { dark: '#1f2a30', light: '#ffffff' } })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [loginUrl]);

  return (
    <Dialog open={open} onClose={onClose} title="Telefon veya tablet bağla" size="md">
      {isLoading ? <p className="text-ink-soft">Adres bulunuyor…</p> : null}
      {data && data.urls.length === 0 ? (
        <p className="text-terracotta">Bu bilgisayar bir ağa bağlı görünmüyor. Wi-Fi veya kablo bağlantısını kontrol edin.</p>
      ) : null}
      {loginUrl ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-ink-soft">
            {isPublic ? 'Telefon kamerasıyla okutun; herhangi bir internetten açılır.' : 'Cihaz aynı Wi-Fi ağına bağlıyken kamerayla okutun.'}
          </p>
          {qr ? <img src={qr} alt={`${loginUrl} adresinin QR kodu`} className="size-64" /> : null}
          <p className="font-mono text-lg font-semibold">{loginUrl}</p>
          {urls.length > 1 ? (
            <div className="text-sm text-ink-soft">
              <p>Diğer adresler:</p>
              {urls.slice(1).map((url) => (
                <p key={url} className="font-mono">
                  {url}/giris
                </p>
              ))}
            </div>
          ) : null}
          {devPort && !isPublic ? (
            <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">
              Geliştirme modu: telefonlar 5173 portuna bağlanır. Canlıda (npm start) port 3000 olur.
            </p>
          ) : null}
          {isPublic ? null : (
          <p className="text-sm text-ink-soft">
            Açılmazsa: adresi Safari/Chrome'a http:// ile yazın, Windows ağ türünün “Özel” olduğunu ve güvenlik duvarında
            bu portun açık olduğunu kontrol edin.
          </p>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
