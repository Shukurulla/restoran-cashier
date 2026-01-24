export interface User {
  _id: string;
  name: string;
  phone: string;
  role: string;
  restaurantId: string;
}

export interface Restaurant {
  _id: string;
  name: string;
}

export interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  readyAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export type PaymentType = 'cash' | 'card' | 'click';

export interface PaymentSplit {
  cash: number;
  card: number;
  click: number;
}

export interface Order {
  _id: string;
  orderNumber: number;
  tableNumber: number;
  tableName: string;
  items: OrderItem[];
  status: 'active' | 'paid' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  paymentType?: PaymentType;
  paymentSplit?: PaymentSplit;
  comment?: string;
  total: number;
  serviceFee: number;
  grandTotal: number;
  waiter: {
    _id: string;
    name: string;
  };
  createdAt: string;
  paidAt?: string;
}

export interface DailySummary {
  totalRevenue: number;
  totalOrders: number;
  cashRevenue: number;
  cardRevenue: number;
  clickRevenue: number;
  activeOrders: number;
  paidOrders: number;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
}

export interface PaymentData {
  orderId: string;
  orderNumber: number;
  tableName: string;
  waiterName: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  serviceFee: number;
  total: number;
  paymentType: PaymentType;
  paymentSplit?: PaymentSplit;
  comment?: string;
  restaurantName: string;
  date: string;
}

export type FilterType = 'active' | 'paid' | 'all';
