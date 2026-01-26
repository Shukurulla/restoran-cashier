"use client";

import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PrinterAPI } from "@/services/printer";
import { Order, DailySummary, PaymentType, PaymentSplit, PartialPaymentResult } from "@/types";
import { Header } from "./Header";
import { SummaryCards } from "./SummaryCards";
import { OrdersSection } from "./OrdersSection";
import { PaymentModal } from "./PaymentModal";
import { SettingsModal } from "./SettingsModal";
import { ReportsModal } from "./ReportsModal";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { SaboyModal } from "./SaboyModal";
import { AddItemsModal } from "./AddItemsModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://server-v2.kepket.uz";

export function Dashboard() {
  const { user, restaurant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DailySummary>({
    totalRevenue: 0,
    totalOrders: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    clickRevenue: 0,
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
  const [isSaboyOpen, setIsSaboyOpen] = useState(false);
  const [addItemsOrder, setAddItemsOrder] = useState<Order | null>(null);
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);

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
      // Cashier room ga qo'shilish
      newSocket.emit("join-restaurant", user.restaurantId);
      newSocket.emit("join_cashier", { restaurantId: user.restaurantId });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Yangi order kelganda (server: new_order_for_cashier)
    newSocket.on("new_order_for_cashier", () => {
      loadData(); // Ma'lumotlarni yangilash
      audio?.play().catch(() => {});
    });

    // Kitchen order kelganda
    newSocket.on("new_kitchen_order", () => {
      loadData();
      audio?.play().catch(() => {});
    });

    // Order yangilanganda
    newSocket.on("order_updated", () => {
      loadData();
    });

    newSocket.on("kitchen_orders_updated", () => {
      loadData();
    });

    // To'lov qilinganda
    newSocket.on("order_paid", () => {
      loadData();
    });

    newSocket.on("order_paid_success", () => {
      loadData();
    });

    // Item status o'zgarganda (kitchen tomonidan)
    newSocket.on("item_status_updated", () => {
      loadData();
    });

    // Order item status o'zgarganda
    newSocket.on("food_status_changed", () => {
      loadData();
    });

    // Barcha itemlar yetkazilganda order tugatildi
    newSocket.on("order_completed", () => {
      loadData();
    });

    // Order o'chirilganda (admin panel tomonidan)
    newSocket.on("order_deleted", () => {
      loadData();
    });

    // Order item o'chirilganda (admin panel tomonidan)
    newSocket.on("order_item_deleted", () => {
      loadData();
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
    paymentType: PaymentType,
    paymentSplit?: PaymentSplit,
    comment?: string,
  ) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;

    try {
      const paidOrder = await api.processPayment(orderId, paymentType, paymentSplit, comment);

      // Update local state
      setOrders((prev) => prev.map((o) => (o._id === orderId ? paidOrder : o)));
      await loadData();
    } catch (error) {
      console.error("To'lov xatosi:", error);
      const errorMessage = error instanceof Error ? error.message : "To'lov amalga oshirilmadi";
      alert(errorMessage);
      throw error; // Re-throw so modal doesn't close
    }
  };

  // Partial payment (qisman to'lov) handler
  const handlePartialPayment = async (
    orderId: string,
    itemIds: string[],
    paymentType: PaymentType,
    paymentSplit?: PaymentSplit,
    comment?: string,
  ): Promise<PartialPaymentResult> => {
    try {
      const result = await api.processPartialPayment(orderId, itemIds, paymentType, paymentSplit, comment);

      // Update local state
      setOrders((prev) => prev.map((o) => (o._id === orderId ? result.order : o)));
      await loadData();

      return result;
    } catch (error) {
      console.error("Qisman to'lov xatosi:", error);
      const errorMessage = error instanceof Error ? error.message : "To'lov amalga oshirilmadi";
      alert(errorMessage);
      throw error;
    }
  };

  const handlePayClick = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentOpen(true);
  };

  const handleDetailsClick = (order: Order) => {
    setDetailsOrder(order);
    setIsDetailsOpen(true);
  };

  const handleAddItemsClick = (order: Order) => {
    setAddItemsOrder(order);
    setIsAddItemsOpen(true);
  };

  const handleAddItemsSuccess = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
    loadData();
  };

  const handlePrintClick = async (order: Order) => {
    console.log("Chek chiqarish boshlandi:", order._id);

    const selectedPrinter = localStorage.getItem("selectedPrinter") || undefined;
    console.log("Tanlangan printer:", selectedPrinter);

    if (!selectedPrinter) {
      alert("Printer tanlanmagan. Sozlamalardan printer tanlang.");
      return;
    }

    const paymentType = order.paymentType || "cash";

    try {
      const result = await PrinterAPI.printPayment(
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          tableName: order.tableName,
          waiterName: order.waiter.name,
          items: order.items
            .filter((item) => item.status !== "cancelled")
            .map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          subtotal: order.total,
          serviceFee: order.serviceFee,
          total: order.grandTotal,
          paymentType,
          restaurantName: restaurant?.name || "Restoran",
          date: new Date().toLocaleString("uz-UZ"),
        },
        selectedPrinter,
      );

      console.log("Chek chiqarish natijasi:", result);

      if (!result.success) {
        alert("Chek chiqarishda xatolik: " + (result.error || "Noma'lum xatolik"));
      }
    } catch (error) {
      console.error("Chek chiqarishda xatolik:", error);
      alert("Chek chiqarishda xatolik yuz berdi");
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-[1600px] mx-auto">
      <Header
        summary={summary}
        isConnected={isConnected}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onReportsClick={() => setIsReportsOpen(true)}
        onSaboyClick={() => setIsSaboyOpen(true)}
      />

      <SummaryCards summary={summary} />

      <OrdersSection
        orders={orders}
        onPayClick={handlePayClick}
        onDetailsClick={handleDetailsClick}
        onPrintClick={handlePrintClick}
        onAddItemsClick={handleAddItemsClick}
        onMergeSuccess={loadData}
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
        onPartialConfirm={handlePartialPayment}
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
        onAddItemsClick={handleAddItemsClick}
      />

      <SaboyModal
        isOpen={isSaboyOpen}
        onClose={() => setIsSaboyOpen(false)}
        onSuccess={loadData}
      />

      <AddItemsModal
        order={addItemsOrder}
        isOpen={isAddItemsOpen}
        onClose={() => {
          setIsAddItemsOpen(false);
          setAddItemsOrder(null);
        }}
        onSuccess={handleAddItemsSuccess}
      />
    </div>
  );
}
