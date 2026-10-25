import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { connectSocket, disconnectSocket } from './api/socket';
import { useAppSelector } from './app/hooks';
import { Toaster } from './components/ui/Toaster';

/** Tüm sayfaların kökü: giriş yapılınca Socket.io bağlantısını açar, çıkışta kapatır. */
export function AppRoot() {
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) connectSocket(token);
    else disconnectSocket();
  }, [token]);

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
