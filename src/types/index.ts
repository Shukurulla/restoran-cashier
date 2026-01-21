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

export interface Order {
  _id: string;
  orderNumber: number;
  tableNumber: number;
  tableName: string;
  items: OrderItem[];
  status: 'active' | 'paid' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  paymentType?: 'cash' | 'card';
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
  paymentType: 'cash' | 'card';
  restaurantName: string;
  date: string;
}

export type FilterType = 'active' | 'paid' | 'all';
