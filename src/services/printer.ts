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

  async printPayment(paymentData: PaymentData, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${PRINT_SERVER_URL}/print/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paymentData, printerName })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to print payment:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  async printTest(printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${PRINT_SERVER_URL}/print/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to print test:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  async printDailyReport(reportData: {
    restaurantName: string;
    date: string;
    totalOrders: number;
    totalRevenue: number;
    cashRevenue: number;
    cardRevenue: number;
    waiterStats?: { name: string; orders: number; revenue: number }[];
  }, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${PRINT_SERVER_URL}/print/daily-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reportData, printerName })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to print daily report:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

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
