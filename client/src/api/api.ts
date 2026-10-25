import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type {
  AddItemsRequest,
  AddItemsResponse,
  AddressesDTO,
  AreaDTO,
  CategoryDTO,
  DailyReportDTO,
  LoginRequest,
  LoginResponse,
  OrderDTO,
  PayRequest,
  PayResponse,
  StaffDTO,
  TicketDTO,
  VoidItemRequest,
} from '@toscana/shared';
import { logout } from '../features/auth/authSlice';

interface StateWithToken {
  auth: { token: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders(headers, { getState }) {
    const token = (getState() as StateWithToken).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  const url = typeof args === 'string' ? args : args.url;
  // Oturum süresi dolduysa giriş ekranına dön (PIN yanlışsa değil).
  if (result.error?.status === 401 && !url.startsWith('auth/')) {
    api.dispatch(logout());
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Staff', 'Menu', 'Areas', 'Order', 'Tickets', 'Report'],
  refetchOnReconnect: true,
  endpoints: (build) => ({
    getStaffList: build.query<StaffDTO[], void>({
      query: () => 'auth/staff',
      providesTags: ['Staff'],
    }),
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
    }),

    getMenu: build.query<CategoryDTO[], void>({
      query: () => 'menu',
      providesTags: ['Menu'],
    }),
    setAvailability: build.mutation<{ productId: number; isAvailable: boolean }, { productId: number; isAvailable: boolean }>({
      query: ({ productId, isAvailable }) => ({
        url: `products/${productId}/availability`,
        method: 'PATCH',
        body: { isAvailable },
      }),
    }),

    getAreas: build.query<AreaDTO[], void>({
      query: () => 'areas',
      providesTags: ['Areas'],
    }),
    getTableOrder: build.query<OrderDTO | null, number>({
      query: (tableId) => `tables/${tableId}/order`,
      providesTags: (_result, _error, tableId) => [{ type: 'Order', id: tableId }],
    }),
    addItems: build.mutation<AddItemsResponse, AddItemsRequest & { tableId: number }>({
      query: ({ tableId, ...body }) => ({ url: `tables/${tableId}/items`, method: 'POST', body }),
    }),
    voidItem: build.mutation<OrderDTO, VoidItemRequest & { itemId: number }>({
      query: ({ itemId, ...body }) => ({ url: `order-items/${itemId}/void`, method: 'POST', body }),
    }),
    moveOrder: build.mutation<OrderDTO, { orderId: number; fromTableId: number; targetTableId: number }>({
      query: ({ orderId, targetTableId }) => ({
        url: `orders/${orderId}/move`,
        method: 'POST',
        body: { targetTableId },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Order', id: arg.fromTableId },
        { type: 'Order', id: arg.targetTableId },
      ],
    }),
    pay: build.mutation<PayResponse, PayRequest & { orderId: number }>({
      query: ({ orderId, ...body }) => ({ url: `orders/${orderId}/payments`, method: 'POST', body }),
      invalidatesTags: ['Report'],
    }),

    getTickets: build.query<TicketDTO[], void>({
      query: () => 'kitchen/tickets',
      providesTags: ['Tickets'],
    }),
    completeTicket: build.mutation<{ ok: true }, number>({
      query: (ticketId) => ({ url: `kitchen/tickets/${ticketId}/complete`, method: 'POST' }),
    }),

    getDailyReport: build.query<DailyReportDTO, string>({
      query: (date) => `reports/daily?date=${encodeURIComponent(date)}`,
      providesTags: ['Report'],
    }),
    getAddresses: build.query<AddressesDTO, void>({
      query: () => 'system/addresses',
    }),
  }),
});

export const {
  useGetStaffListQuery,
  useLoginMutation,
  useGetMenuQuery,
  useSetAvailabilityMutation,
  useGetAreasQuery,
  useGetTableOrderQuery,
  useAddItemsMutation,
  useVoidItemMutation,
  useMoveOrderMutation,
  usePayMutation,
  useGetTicketsQuery,
  useCompleteTicketMutation,
  useGetDailyReportQuery,
  useGetAddressesQuery,
} = api;
