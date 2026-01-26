import { User, Restaurant, Order, DailySummary, PaymentType, PaymentSplit, SaboyItem } from "@/types";

// Yangi backend v2 URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://server-v2.kepket.uz";

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("restaurant");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: "Xatolik yuz berdi" }));
      throw new Error(error.message || "Xatolik yuz berdi");
    }

    return res.json();
  }

  // ========== AUTH (yangi endpoint: /api/auth/login) ==========
  async login(
    phone: string,
    password: string,
  ): Promise<{ user: User; token: string; restaurant: Restaurant }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });

    // Yangi backend response: { success, data: { staff, token, restaurant } }
    const responseData = data.data || data;
    this.setToken(responseData.token);

    const staff = responseData.staff;
    const user: User = {
      _id: staff._id,
      name: `${staff.firstName} ${staff.lastName}`,
      phone: staff.phone,
      role: staff.role,
      restaurantId: staff.restaurantId,
    };

    const restaurant: Restaurant = {
      _id: responseData.restaurant?._id || '',
      name: responseData.restaurant?.name || '',
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("restaurant", JSON.stringify(restaurant));
    }

    return { user, token: responseData.token, restaurant };
  }

  // ========== ORDERS (yangi format: items[] massiv) ==========
  async getOrders(): Promise<Order[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any>("/api/orders/today");

    // Yangi backend: { success, data: { orders } }
    const orders = data.data?.orders || data.data || data.orders || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return orders.map((order: any, index: number) => {
      // Yangi format: items[] (eski selectFoods/allOrders o'rniga)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (order.items || []).map((item: any, idx: number) => ({
        _id: item._id || `item-${idx}`,
        name: item.foodId?.name || item.foodName || item.name || 'Noma\'lum',
        quantity: item.quantity || 1,
        price: item.price || 0,
        status: item.status || item.kitchenStatus || 'pending',
      }));

      const tableNumber = order.tableId?.number || order.tableNumber || 0;
      const tableName = order.tableId?.number ? `Stol ${order.tableId.number}` : (order.tableName || 'Noma\'lum stol');

      // Order type - saboy yoki dine-in
      const orderType = order.orderType || (order.isSaboy ? 'saboy' : undefined);
      const isSaboy = orderType === 'saboy';

      // Agar backend summalarni qaytarmasa, frontendda hisoblaymiz
      const subtotal = order.subtotal || items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
      // Saboy uchun xizmat haqqi yo'q
      const serviceChargePercent = isSaboy ? 0 : (order.serviceChargePercent || 10);
      const serviceCharge = isSaboy ? 0 : (order.serviceCharge || Math.round(subtotal * (serviceChargePercent / 100)));
      const grandTotal = order.grandTotal || (subtotal + serviceCharge);

      // To'lov statusi: isPaid yoki status === 'paid'
      const isPaid = order.isPaid === true || order.status === 'paid';

      return {
        _id: order._id,
        orderNumber: order.orderNumber || index + 1,
        orderType: orderType,
        saboyNumber: order.saboyNumber || order.orderNumber,
        tableNumber,
        tableName: isSaboy ? 'Soboy' : tableName,
        items,
        status: isPaid ? 'paid' : 'active',
        paymentStatus: isPaid ? 'paid' : 'pending',
        paymentType: order.paymentType,
        total: subtotal,
        serviceFee: serviceCharge,
        grandTotal: grandTotal,
        waiter: {
          _id: order.waiterId?._id || order.waiterId || '',
          name: order.waiterId?.firstName
            ? `${order.waiterId.firstName} ${order.waiterId.lastName}`
            : (order.waiterName || 'Noma\'lum'),
        },
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      } as Order;
    });
  }

  async getDailySummary(): Promise<DailySummary> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any>("/api/reports/dashboard?period=today");

    const summary = data.data?.summary || data.summary || {};

    // To'lov turlari bo'yicha
    let cashRevenue = 0, cardRevenue = 0, clickRevenue = 0;
    try {
      const today = new Date().toISOString().split('T')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentData = await this.request<any>(`/api/reports/payments?startDate=${today}`);
      const breakdown = paymentData.data?.paymentBreakdown || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cashRevenue = breakdown.find((p: any) => p.method === 'cash')?.total || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cardRevenue = breakdown.find((p: any) => p.method === 'card')?.total || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clickRevenue = breakdown.find((p: any) => p.method === 'click')?.total || 0;
    } catch {
      // Ignore payment report errors
    }

    return {
      totalRevenue: summary.totalRevenue || 0,
      totalOrders: summary.totalOrders || 0,
      cashRevenue,
      cardRevenue,
      clickRevenue,
      activeOrders: (summary.totalOrders || 0) - (summary.completedOrders || 0),
      paidOrders: summary.completedOrders || 0,
    };
  }

  async processPayment(
    orderId: string,
    paymentType: PaymentType,
    paymentSplit?: PaymentSplit,
    comment?: string,
  ): Promise<Order> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any>(
      `/api/orders/${orderId}/pay`,
      {
        method: "POST",
        body: JSON.stringify({
          paymentType: paymentType,
          paymentSplit,
          comment: comment,
        }),
      },
    );

    const order = data.data || data.order || data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order.items || []).map((item: any, idx: number) => ({
      _id: item._id || `item-${idx}`,
      name: item.foodId?.name || item.foodName || item.name || 'Noma\'lum',
      quantity: item.quantity || 1,
      price: item.price || 0,
      status: 'ready',
    }));

    // Order type - saboy yoki dine-in
    const orderType = order.orderType || (order.isSaboy ? 'saboy' : undefined);
    const isSaboy = orderType === 'saboy';

    // Agar backend summalarni qaytarmasa, frontendda hisoblaymiz
    const subtotal = order.subtotal || items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    // Saboy uchun xizmat haqqi yo'q
    const serviceChargePercent = isSaboy ? 0 : (order.serviceChargePercent || 10);
    const serviceCharge = isSaboy ? 0 : (order.serviceCharge || Math.round(subtotal * (serviceChargePercent / 100)));
    const grandTotal = order.grandTotal || (subtotal + serviceCharge);

    const tableNumber = order.tableId?.number || 0;
    const tableName = isSaboy ? 'Soboy' : `Stol ${tableNumber}`;

    return {
      _id: order._id,
      orderNumber: order.orderNumber || 1,
      orderType: orderType,
      saboyNumber: order.saboyNumber || order.orderNumber,
      tableNumber,
      tableName,
      items,
      status: 'paid',
      paymentStatus: 'paid',
      paymentType: order.paymentType,
      total: subtotal,
      serviceFee: serviceCharge,
      grandTotal: grandTotal,
      waiter: {
        _id: order.waiterId?._id || '',
        name: order.waiterId?.firstName
          ? `${order.waiterId.firstName} ${order.waiterId.lastName}`
          : 'Noma\'lum',
      },
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    } as Order;
  }

  async getWaiterStats(): Promise<
    { name: string; orders: number; revenue: number }[]
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any>("/api/reports/staff");
    const staff = data.data?.staff || data.staff || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return staff.map((s: any) => ({
      name: s.name,
      orders: s.totalOrders || 0,
      revenue: s.totalRevenue || 0,
    }));
  }

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getStoredRestaurant(): Restaurant | null {
    if (typeof window === "undefined") return null;
    const restaurantStr = localStorage.getItem("restaurant");
    if (!restaurantStr) return null;

    try {
      const parsed = JSON.parse(restaurantStr);
      return {
        _id: parsed._id || parsed.id || '',
        name: parsed.name || '',
      };
    } catch {
      return null;
    }
  }

  // ========== SABOY ==========
  async createSaboyOrder(
    items: SaboyItem[],
    paymentType: PaymentType,
    paymentSplit?: PaymentSplit,
    comment?: string,
  ): Promise<{ success: boolean; saboyNumber: number; grandTotal: number }> {
    const restaurant = this.getStoredRestaurant();
    if (!restaurant) {
      throw new Error("Restoran topilmadi");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any>("/api/orders/saboy", {
      method: "POST",
      body: JSON.stringify({
        items: items.map(item => ({
          foodId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod: paymentType,
        paymentSplit,
        notes: comment,
      }),
    });

    return {
      success: data.success,
      saboyNumber: data.data?.orderNumber || 0,
      grandTotal: data.data?.finalTotal || 0,
    };
  }

  // ========== MENU (yangi endpoint: /api/foods/menu) ==========
  async getMenuItems(): Promise<{ _id: string; name: string; price: number; category: string; categoryName?: string }[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.request<any>('/api/foods/menu');

    const menu = response.data || response || [];
    const foods: { _id: string; name: string; price: number; category: string; categoryName?: string }[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const category of menu) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const food of (category.foods || [])) {
        foods.push({
          _id: food._id,
          name: food.name,
          price: food.price || 0,
          category: category._id,
          categoryName: category.name,
        });
      }
    }

    return foods;
  }

  // ========== CATEGORIES (yangi endpoint: /api/categories) ==========
  async getCategories(): Promise<{ _id: string; title: string }[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.request<any>('/api/categories');
    const categories = response.data || response || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return categories.map((cat: any) => ({
      _id: cat._id,
      title: cat.name || cat.title || '',
    }));
  }
}

export const api = new ApiService();
