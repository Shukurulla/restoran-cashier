import { User, Restaurant, Order, DailySummary, PaymentType, PaymentSplit, SaboyItem } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://server.kepket.uz";

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

  async login(
    phone: string,
    password: string,
  ): Promise<{ user: User; token: string; restaurant: Restaurant }> {
    const data = await this.request<{
      staff: User;
      token: string;
      restaurant: Restaurant;
    }>("/api/staff/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });

    this.setToken(data.token);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data.staff));
      localStorage.setItem("restaurant", JSON.stringify(data.restaurant));
    }

    return { user: data.staff, token: data.token, restaurant: data.restaurant };
  }

  async getOrders(): Promise<Order[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<{ orders: any[] }>("/api/orders/today");

    // Server ma'lumotlarini frontend Order tipiga transformatsiya qilish
    return (data.orders || []).map((order, index) => {
      const items = (order.selectFoods || order.allOrders || []).map((item: Record<string, unknown>, idx: number) => ({
        _id: (item._id as string) || `item-${idx}`,
        name: (item.name as string) || (item.foodName as string) || 'Noma\'lum',
        quantity: (item.quantity as number) || 1,
        price: (item.price as number) || 0,
        status: (item.status as string) || 'pending',
      }));

      const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity, 0);
      const serviceFee = order.ofitsianService || Math.round(subtotal * 0.1);
      const grandTotal = subtotal + serviceFee;

      return {
        _id: order._id,
        orderNumber: index + 1,
        tableNumber: order.tableNumber || 0,
        tableName: order.tableName || 'Noma\'lum stol',
        items,
        status: order.isPaid ? 'paid' : 'active',
        paymentStatus: order.isPaid ? 'paid' : 'pending',
        paymentType: order.paymentType,
        total: subtotal,
        serviceFee,
        grandTotal,
        waiter: {
          _id: order.waiterId || '',
          name: order.waiterName || 'Noma\'lum',
        },
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      } as Order;
    });
  }

  async getDailySummary(): Promise<DailySummary> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<any>("/api/orders/daily-summary");

    return {
      totalRevenue: data.totalRevenue || 0,
      totalOrders: data.totalOrders || 0,
      cashRevenue: data.cashRevenue || 0,
      cardRevenue: data.cardRevenue || 0,
      clickRevenue: data.clickRevenue || 0,
      activeOrders: data.totalOrders - (data.paidOrders || 0),
      paidOrders: data.paidOrders || 0,
    };
  }

  async processPayment(
    orderId: string,
    paymentType: PaymentType,
    paymentSplit?: PaymentSplit,
    comment?: string,
  ): Promise<Order> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.request<{ order: any }>(
      `/api/orders/${orderId}/pay`,
      {
        method: "POST",
        body: JSON.stringify({
          paymentType,
          paymentSplit,
          comment,
        }),
      },
    );

    const order = data.order;
    const items = (order.selectFoods || order.allOrders || []).map((item: Record<string, unknown>, idx: number) => ({
      _id: (item._id as string) || `item-${idx}`,
      name: (item.name as string) || (item.foodName as string) || 'Noma\'lum',
      quantity: (item.quantity as number) || 1,
      price: (item.price as number) || 0,
      status: (item.status as string) || 'ready',
    }));

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity, 0);
    const serviceFee = order.ofitsianService || Math.round(subtotal * 0.1);
    const grandTotal = subtotal + serviceFee;

    return {
      _id: order._id,
      orderNumber: 1,
      tableNumber: order.tableNumber || 0,
      tableName: order.tableName || 'Noma\'lum stol',
      items,
      status: 'paid',
      paymentStatus: 'paid',
      paymentType: order.paymentType,
      total: subtotal,
      serviceFee,
      grandTotal,
      waiter: {
        _id: order.waiterId || '',
        name: order.waiterName || 'Noma\'lum',
      },
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    } as Order;
  }

  async getWaiterStats(): Promise<
    { name: string; orders: number; revenue: number }[]
  > {
    const data = await this.request<{
      stats: { name: string; orders: number; revenue: number }[];
    }>("/api/orders/waiter-stats");
    return data.stats;
  }

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getStoredRestaurant(): Restaurant | null {
    if (typeof window === "undefined") return null;
    const restaurantStr = localStorage.getItem("restaurant");
    return restaurantStr ? JSON.parse(restaurantStr) : null;
  }

  // Saboy order yaratish - to'g'ridan-to'g'ri to'langan
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

    const data = await this.request<{
      success: boolean;
      saboyNumber: number;
      grandTotal: number;
    }>("/api/orders/saboy", {
      method: "POST",
      body: JSON.stringify({
        restaurantId: restaurant._id,
        items: items.map(item => ({
          _id: item._id,
          name: item.name,
          foodName: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
        })),
        paymentType,
        paymentSplit,
        comment,
      }),
    });

    return data;
  }

  // Menu (taomlar) ro'yxatini olish
  async getMenuItems(): Promise<{ _id: string; name: string; price: number; category: string; categoryName?: string }[]> {
    const restaurant = this.getStoredRestaurant();
    if (!restaurant) return [];

    const data = await this.request<{ data: { _id: string; foodName: string; price: number; category: string }[] }>(
      `/foods?restaurantId=${restaurant._id}`
    );

    return (data.data || []).map(item => ({
      _id: item._id,
      name: item.foodName,
      price: item.price,
      category: item.category,
    }));
  }

  // Kategoriyalar ro'yxatini olish
  async getCategories(): Promise<{ _id: string; title: string }[]> {
    const restaurant = this.getStoredRestaurant();
    if (!restaurant) return [];

    const data = await this.request<{ data: { _id: string; title: string }[] }>(
      `/category?restaurantId=${restaurant._id}`
    );

    return data.data || [];
  }
}

export const api = new ApiService();
