import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoginResponse, StaffDTO, StaffRole } from '@toscana/shared';
import { readJSON } from '../../lib/storage';

export const AUTH_STORAGE_KEY = 'toscana.auth';

export interface AuthState {
  token: string | null;
  staff: StaffDTO | null;
}

function loadAuth(): AuthState {
  const saved = readJSON<AuthState | null>(AUTH_STORAGE_KEY, null);
  if (saved?.token && saved.staff) return saved;
  return { token: null, staff: null };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadAuth(),
  reducers: {
    setCredentials(state, action: PayloadAction<LoginResponse>) {
      state.token = action.payload.token;
      state.staff = action.payload.staff;
    },
    logout(state) {
      state.token = null;
      state.staff = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

export function homePathFor(role: StaffRole): string {
  if (role === 'WAITER') return '/garson';
  if (role === 'KITCHEN') return '/mutfak';
  return '/kasa';
}
