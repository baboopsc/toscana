import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import type { StaffRole } from '@toscana/shared';
import { useAppSelector } from '../../app/hooks';
import { homePathFor } from './authSlice';

/** Giriş yapılmamışsa /giris'e, başka rolün ekranıysa kendi ekranına yönlendirir. */
export function RequireRole({ roles, children }: { roles: StaffRole[]; children: ReactNode }) {
  const staff = useAppSelector((state) => state.auth.staff);
  if (!staff) return <Navigate to="/giris" replace />;
  if (!roles.includes(staff.role)) return <Navigate to={homePathFor(staff.role)} replace />;
  return <>{children}</>;
}

export function HomeRedirect() {
  const staff = useAppSelector((state) => state.auth.staff);
  return <Navigate to={staff ? homePathFor(staff.role) : '/giris'} replace />;
}
