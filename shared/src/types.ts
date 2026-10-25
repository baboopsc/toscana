// Sunucu ve arayüzün ortak dili. Tüm tutarlar kuruş cinsinden tam sayıdır (250 TL = 25000).

export type Kurus = number;

export type StaffRole = 'ADMIN' | 'CASHIER' | 'WAITER' | 'KITCHEN';
export type OrderStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type OrderItemStatus = 'ACTIVE' | 'VOID';
export type PaymentMethod = 'CASH' | 'CARD';

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Yönetici',
  CASHIER: 'Kasa',
  WAITER: 'Garson',
  KITCHEN: 'Mutfak',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Nakit',
  CARD: 'Kart',
};

export interface StaffDTO {
  id: number;
  name: string;
  role: StaffRole;
}

export interface LoginRequest {
  staffId: number;
  pin: string;
}

export interface LoginResponse {
  token: string;
  staff: StaffDTO;
}

// ---------- Menü ----------

export interface ModifierDTO {
  id: number;
  name: string;
  price: Kurus;
}

export interface ProductDTO {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: Kurus;
  vatRate: number;
  isNew: boolean;
  isAvailable: boolean;
  modifiers: ModifierDTO[];
}

export interface CategoryDTO {
  id: number;
  name: string;
  isNew: boolean;
  products: ProductDTO[];
}

// ---------- Masalar ----------

export interface TableSummaryDTO {
  id: number;
  name: string;
  areaId: number;
  orderId: number | null;
  total: Kurus;
  openedAt: string | null;
}

export interface AreaDTO {
  id: number;
  name: string;
  tables: TableSummaryDTO[];
}

// ---------- Adisyon ----------

export interface OrderItemModifierDTO {
  name: string;
  price: Kurus;
}

export interface OrderItemDTO {
  id: number;
  ticketId: number;
  productId: number;
  productName: string;
  unitPrice: Kurus;
  vatRate: number;
  quantity: number;
  paidQuantity: number;
  modifiers: OrderItemModifierDTO[];
  note: string | null;
  status: OrderItemStatus;
  voidReason: string | null;
  lineTotal: Kurus;
}

export interface OrderTotals {
  gross: Kurus; // Genel toplam (KDV dahil)
  vat: Kurus; // KDV
  net: Kurus; // Ara toplam (KDV hariç)
  paid: Kurus;
  remaining: Kurus;
}

export interface OrderDTO {
  id: number;
  tableId: number;
  tableName: string;
  status: OrderStatus;
  openedAt: string;
  openedBy: string;
  items: OrderItemDTO[];
  totals: OrderTotals;
}

export interface AddItemLine {
  productId: number;
  quantity: number;
  modifierIds: number[];
  note?: string | null;
}

export interface AddItemsRequest {
  clientRequestId: string;
  items: AddItemLine[];
}

export interface AddItemsResponse {
  order: OrderDTO;
  ticketId: number;
}

export interface VoidItemRequest {
  quantity: number;
  reason: string;
}

export interface MoveOrderRequest {
  targetTableId: number;
}

// ---------- Ödeme ----------

export interface PayRequest {
  method: PaymentMethod;
  items?: { orderItemId: number; quantity: number }[];
}

export interface PaymentDTO {
  id: number;
  method: PaymentMethod;
  amount: Kurus;
  createdAt: string;
}

export interface PayResponse {
  order: OrderDTO;
  payment: PaymentDTO;
}

// ---------- Mutfak ----------

export type TicketItemDTO = Pick<
  OrderItemDTO,
  'id' | 'productName' | 'quantity' | 'modifiers' | 'note' | 'status'
>;

export interface TicketDTO {
  id: number;
  orderId: number;
  tableName: string;
  waiterName: string;
  createdAt: string;
  round: number; // masanın kaçıncı gönderimi (2. tur, 3. tur…)
  items: TicketItemDTO[];
}

// ---------- Gün sonu ----------

export interface DailyReportDTO {
  date: string;
  cash: Kurus;
  card: Kurus;
  total: Kurus;
  paymentCount: number;
  closedOrderCount: number;
  openOrderCount: number;
  openRemaining: Kurus;
  products: { name: string; quantity: number; amount: Kurus }[];
  voids: {
    productName: string;
    quantity: number;
    amount: Kurus;
    reason: string;
    staffName: string;
    at: string;
  }[];
}

// ---------- Sistem ----------

export interface HealthDTO {
  ok: true;
  serverTime: number;
}

export interface AddressesDTO {
  port: number;
  urls: string[];
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
