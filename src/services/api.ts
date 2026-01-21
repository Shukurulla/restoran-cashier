import { User, Restaurant, Order, DailySummary } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://kepket.kerek.uz";

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
    const data = await this.request<{ orders: Order[] }>("/api/orders/today");
    return data.orders;
  }

  async getDailySummary(): Promise<DailySummary> {
    return this.request<DailySummary>("/api/orders/daily-summary");
  }

  async processPayment(
    orderId: string,
    paymentType: "cash" | "card",
  ): Promise<Order> {
    const data = await this.request<{ order: Order }>(
      `/api/orders/${orderId}/pay`,
      {
        method: "POST",
        body: JSON.stringify({ paymentType }),
      },
    );
    return data.order;
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
}

export const api = new ApiService();
