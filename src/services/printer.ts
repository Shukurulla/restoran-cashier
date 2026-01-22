import { PrinterInfo, PaymentData } from '@/types';
import {
  generateTestReceiptHTML,
  generatePaymentReceiptHTML,
  generateReportReceiptHTML,
  generateWaiterReportHTML,
  generateCancelledReportHTML,
  type PaymentData as ReceiptPaymentData,
  type ReportData,
  type WaiterReportData,
  type CancelledReportData,
} from '@/utils/receipt-generator';

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
      // @/types PaymentData ni receipt-generator PaymentData ga mapping qilish
      const receiptData: ReceiptPaymentData = {
        items: paymentData.items.map(item => ({
          foodName: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        tableName: paymentData.tableName,
        waiterName: paymentData.waiterName,
        restaurantName: paymentData.restaurantName,
        itemsTotal: paymentData.subtotal,
        serviceFee: paymentData.serviceFee,
        totalPrice: paymentData.total,
        paymentType: paymentData.paymentType,
        isPaid: true,
      };

      const html = generatePaymentReceiptHTML(receiptData);
      return await this.printHTML(html, printerName);
    } catch (error) {
      console.error('Failed to print payment:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  async printTest(printerName?: string, restaurantName: string = 'KEPKET'): Promise<{ success: boolean; error?: string }> {
    try {
      // Frontendda HTML generatsiya qilish
      const html = generateTestReceiptHTML(restaurantName);
      return await this.printHTML(html, printerName);
    } catch (error) {
      console.error('Failed to print test:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  async printDailyReport(reportData: ReportData, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Frontendda HTML generatsiya qilish
      const html = generateReportReceiptHTML(reportData);
      return await this.printHTML(html, printerName);
    } catch (error) {
      console.error('Failed to print daily report:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  async printWaiterReport(reportData: WaiterReportData, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Frontendda HTML generatsiya qilish
      const html = generateWaiterReportHTML(reportData);
      return await this.printHTML(html, printerName);
    } catch (error) {
      console.error('Failed to print waiter report:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  async printCancelledReport(reportData: CancelledReportData, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Frontendda HTML generatsiya qilish
      const html = generateCancelledReportHTML(reportData);
      return await this.printHTML(html, printerName);
    } catch (error) {
      console.error('Failed to print cancelled report:', error);
      return { success: false, error: 'Printer server bilan bog\'lanib bo\'lmadi' };
    }
  },

  // HTML to'g'ridan-to'g'ri chop etish
  async printHTML(html: string, printerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${PRINT_SERVER_URL}/print/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, printerName })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to print HTML:', error);
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
