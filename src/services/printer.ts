

import { PrinterInfo, PaymentData } from '@/types';

const PRINT_SERVER_URL = 'http://localhost:3847';

export const PrinterAPI = {
  async getPrinters(): Promise<PrinterInfo[]> {
    try {
      const res = await fetch(`${PRINT_SERVER_URL}/printers`);
      const data = await res.json();
      return data.printers || [];
    } catch (error) {
      console.error('Failed to get printers:', error);
      return [];
    }
  },

  // To'lov cheki - C# TSPL orqali professional chop etish
  async printPayment(paymentData: PaymentData, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Agar printerName berilmagan bo'lsa, localStorage dan olish
      const selectedPrinter = printerName || (typeof window !== 'undefined' ? localStorage.getItem('selectedPrinter') : null);
      
      if (!selectedPrinter) {
        return { success: false, error: 'Printer tanlanmagan. Sozlamalardan printer tanlang.' };
      }

      const res = await fetch(`${PRINT_SERVER_URL}/print/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerName: selectedPrinter,
          restaurantName: paymentData.restaurantName,
          tableName: paymentData.tableName,
          waiterName: paymentData.waiterName,
          items: paymentData.items.map(item => ({
            foodName: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalPrice: paymentData.total,
          serviceFee: paymentData.serviceFee,
          discount: 0,
        })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to print payment:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  // Test print - C# TSPL orqali
  async printTest(printerName?: string, restaurantName: string = 'KEPKET'): Promise<{ success: boolean; error?: string }> {
    try {
      const selectedPrinter = printerName || (typeof window !== 'undefined' ? localStorage.getItem('selectedPrinter') : null);
      
      if (!selectedPrinter) {
        return { success: false, error: 'Printer tanlanmagan' };
      }

      const res = await fetch(`${PRINT_SERVER_URL}/print/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          printerName: selectedPrinter,
          restaurantName 
        })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to print test:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  // Kunlik hisobot - C# TSPL orqali
  async printDailyReport(reportData: {
    restaurantName: string;
    date?: string;
    totalOrders?: number;
    totalRevenue?: number;
    cashRevenue?: number;
    cardRevenue?: number;
    waiterStats?: Array<{ name: string; orders: number; revenue: number }>;
  }, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const selectedPrinter = printerName || (typeof window !== 'undefined' ? localStorage.getItem('selectedPrinter') : null);
      
      if (!selectedPrinter) {
        return { success: false, error: 'Printer tanlanmagan' };
      }

      // Hisobotni text formatda yaratish
      const lines: string[] = [];
      lines.push(reportData.restaurantName || 'RESTORAN');
      lines.push('================================');
      lines.push('KUNLIK HISOBOT');
      lines.push('================================');
      lines.push(`Sana: ${reportData.date || new Date().toLocaleDateString('uz-UZ')}`);
      if (reportData.totalOrders !== undefined) {
        lines.push(`Buyurtmalar: ${reportData.totalOrders} ta`);
      }
      lines.push('--------------------------------');
      if (reportData.cashRevenue !== undefined) {
        lines.push(`Naqd: ${reportData.cashRevenue.toLocaleString()} so'm`);
      }
      if (reportData.cardRevenue !== undefined) {
        lines.push(`Karta: ${reportData.cardRevenue.toLocaleString()} so'm`);
      }
      lines.push('================================');
      if (reportData.totalRevenue !== undefined) {
        lines.push(`JAMI: ${reportData.totalRevenue.toLocaleString()} so'm`);
      }
      
      // Ofitsiantlar statistikasi
      if (reportData.waiterStats && reportData.waiterStats.length > 0) {
        lines.push('--------------------------------');
        lines.push('OFITSIANTLAR:');
        lines.push('--------------------------------');
        for (const waiter of reportData.waiterStats) {
          lines.push(`${waiter.name}: ${waiter.orders} ta, ${waiter.revenue.toLocaleString()}`);
        }
      }
      
      lines.push('================================');

      const res = await fetch(`${PRINT_SERVER_URL}/print/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerName: selectedPrinter,
          text: lines.join('\n')
        })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to print daily report:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  // Printer server bilan aloqani tekshirish
  async checkConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${PRINT_SERVER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
