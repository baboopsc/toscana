import { createBrowserRouter } from 'react-router';
import { AppRoot } from './AppRoot';
import { HomeRedirect, RequireRole } from './features/auth/RequireRole';
import { CashierLayout } from './layouts/CashierLayout';
import { KitchenLayout } from './layouts/KitchenLayout';
import { WaiterLayout } from './layouts/WaiterLayout';
import { LoginPage } from './pages/LoginPage';
import { BillPage } from './pages/garson/BillPage';
import { CartPage } from './pages/garson/CartPage';
import { OrderPage } from './pages/garson/OrderPage';
import { TablesPage } from './pages/garson/TablesPage';
import { DailyReportPage } from './pages/kasa/DailyReportPage';
import { FloorPage } from './pages/kasa/FloorPage';
import { PosPage } from './pages/kasa/PosPage';
import { KitchenBoardPage } from './pages/mutfak/KitchenBoardPage';

export const router = createBrowserRouter([
  {
    element: <AppRoot />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      { path: '/giris', element: <LoginPage /> },
      {
        path: '/garson',
        element: (
          <RequireRole roles={['WAITER']}>
            <WaiterLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <TablesPage /> },
          { path: 'masa/:tableId', element: <OrderPage /> },
          { path: 'masa/:tableId/sepet', element: <CartPage /> },
          { path: 'masa/:tableId/hesap', element: <BillPage /> },
        ],
      },
      {
        path: '/kasa',
        element: (
          <RequireRole roles={['CASHIER', 'ADMIN']}>
            <CashierLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <FloorPage /> },
          { path: 'masa/:tableId', element: <PosPage /> },
          { path: 'rapor', element: <DailyReportPage /> },
        ],
      },
      {
        path: '/mutfak',
        element: (
          <RequireRole roles={['KITCHEN']}>
            <KitchenLayout />
          </RequireRole>
        ),
        children: [{ index: true, element: <KitchenBoardPage /> }],
      },
      { path: '*', element: <HomeRedirect /> },
    ],
  },
]);
