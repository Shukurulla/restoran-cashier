"use client";

import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PrinterAPI } from "@/services/printer";
import { Order, DailySummary } from "@/types";
import { Header } from "./Header";
import { SummaryCards } from "./SummaryCards";
import { OrdersSection } from "./OrdersSection";
import { PaymentModal } from "./PaymentModal";
import { SettingsModal } from "./SettingsModal";
import { ReportsModal } from "./ReportsModal";
import { OrderDetailsModal } from "./OrderDetailsModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://server.kepket.uz";

export function Dashboard() {
  const { user, restaurant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DailySummary>({
    totalRevenue: 0,
    totalOrders: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    activeOrders: 0,
    paidOrders: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Audio for notifications
  const [audio] = useState(() => {
    if (typeof window !== "undefined") {
      const a = new Audio();
      a.src = "/notification.mp3";
      return a;
    }
    return null;
  });

  const loadData = useCallback(async () => {
    try {
      const [ordersData, summaryData] = await Promise.all([
        api.getOrders(),
        api.getDailySummary(),
      ]);
      setOrders(ordersData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }, []);

  // Socket connection
  useEffect(() => {
    const token = api.getToken();
    if (!token || !user?.restaurantId) return;

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("join-restaurant", user.restaurantId);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("new-order", (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      setSummary((prev) => ({
        ...prev,
        totalOrders: prev.totalOrders + 1,
        activeOrders: prev.activeOrders + 1,
      }));
      audio?.play().catch(() => {});
    });

    newSocket.on("order-updated", (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
      );
    });

    newSocket.on("order-paid", (paidOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === paidOrder._id ? paidOrder : o)),
      );
      loadData(); // Refresh summary
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.restaurantId, audio, loadData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePayment = async (
    orderId: string,
    paymentType: "cash" | "card",
  ) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;

    const paidOrder = await api.processPayment(orderId, paymentType);

    // Print receipt
    const selectedPrinter =
      localStorage.getItem("selectedPrinter") || undefined;
    await PrinterAPI.printPayment(
      {
        orderId: paidOrder._id,
        orderNumber: paidOrder.orderNumber,
        tableName: paidOrder.tableName,
        waiterName: paidOrder.waiter.name,
        items: paidOrder.items
          .filter((item) => item.status !== "cancelled")
          .map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        subtotal: paidOrder.total,
        serviceFee: paidOrder.serviceFee,
        total: paidOrder.grandTotal,
        paymentType,
        restaurantName: restaurant?.name || "Restoran",
        date: new Date().toLocaleString("uz-UZ"),
      },
      selectedPrinter,
    );

    // Update local state
    setOrders((prev) => prev.map((o) => (o._id === orderId ? paidOrder : o)));
    loadData();
  };

  const handlePayClick = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentOpen(true);
  };

  const handleDetailsClick = (order: Order) => {
    setDetailsOrder(order);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen p-6 max-w-[1600px] mx-auto">
      <Header
        summary={summary}
        isConnected={isConnected}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onReportsClick={() => setIsReportsOpen(true)}
      />

      <SummaryCards summary={summary} />

      <OrdersSection
        orders={orders}
        onPayClick={handlePayClick}
        onDetailsClick={handleDetailsClick}
      />

      {/* Modals */}
      <PaymentModal
        order={selectedOrder}
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handlePayment}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        summary={summary}
      />

      <OrderDetailsModal
        order={detailsOrder}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsOrder(null);
        }}
        onPayClick={handlePayClick}
      />
    </div>
  );
}
