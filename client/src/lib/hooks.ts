import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { HealthDTO, ProductDTO } from '@toscana/shared';
import { api, useGetMenuQuery } from '../api/api';
import { disconnectSocket } from '../api/socket';
import { useAppDispatch } from '../app/hooks';
import { logout } from '../features/auth/authSlice';

/** Belirli aralıklarla yenilenen "şimdi" (ms). Geçen süre göstergeleri için. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Cihaz saatiyle sunucu saati arasındaki fark (ms). Mutfak süreleri sunucu saatine göre hesaplanır. */
export function useServerOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const sentAt = Date.now();
        const response = await fetch('/api/health', { cache: 'no-store' });
        const body = (await response.json()) as HealthDTO;
        const receivedAt = Date.now();
        if (!cancelled) setOffset(body.serverTime - (sentAt + receivedAt) / 2);
      } catch {
        // sunucuya ulaşılamazsa cihaz saatiyle devam
      }
    }
    void sync();
    const id = window.setInterval(() => void sync(), 5 * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
  return offset;
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  return () => {
    disconnectSocket();
    dispatch(logout());
    dispatch(api.util.resetApiState());
    navigate('/giris', { replace: true });
  };
}

/** Menüdeki ürünlere id ile hızlı erişim. */
export function useProductMap(): Map<number, ProductDTO> {
  const { data: menu } = useGetMenuQuery();
  return useMemo(() => {
    const map = new Map<number, ProductDTO>();
    for (const category of menu ?? []) for (const product of category.products) map.set(product.id, product);
    return map;
  }, [menu]);
}
