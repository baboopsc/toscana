import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ConnectionStatus = 'idle' | 'connecting' | 'online' | 'offline';

const connectionSlice = createSlice({
  name: 'connection',
  initialState: { status: 'idle' as ConnectionStatus },
  reducers: {
    setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setConnectionStatus } = connectionSlice.actions;
export default connectionSlice.reducer;
