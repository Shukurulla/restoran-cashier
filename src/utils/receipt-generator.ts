/**
 * Receipt Generator Utility
 * Professional thermal printer check formati
 * 80mm printer uchun optimallashtirilgan
 */

const SEP = '--------------------------------'; // 32 ta belgi
const SEP_DOUBLE = '================================';

interface PaymentItem {
  foodName: string;
  quantity: number;
  price: number;
}

interface PaymentData {
  items: PaymentItem[];
  tableName: string;
  waiterName?: string;
  cashierName?: string;
  restaurantName: string;
  restaurantAddress?: string;
  itemsTotal: number;
  serviceFee?: number;
  discount?: number;
  totalPrice: number;
  paymentType: 'cash' | 'card' | string;
  isPaid?: boolean;
}

interface ReportData {
  restaurantName: string;
  totalCash: number;
  totalCard: number;
  totalUnpaid?: number;
}

interface WaiterData {
  name: string;
  cash: number;
  card: number;
  unpaid?: number;
}

interface WaiterReportData {
  restaurantName: string;
  waiters: WaiterData[];
}

interface CancelledItem {
  foodName: string;
  quantity: number;
  price: number;
}

interface CancelledReportData {
  restaurantName: string;
  items: CancelledItem[];
}

// Vaqtni formatlash
function formatDateTime(date: Date | string = new Date()): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Narxni formatlash
function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ').format(price || 0);
}

// Professional HTML generatsiya
function generateHTML(bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 100%;
      padding: 2mm;
      background: white;
      color: black;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .header { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
    .subheader { font-size: 12px; }
    .large { font-size: 13px; font-weight: bold; }
    .footer { margin-top: 4px; }
    .sep { text-align: center; margin: 2px 0; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      white-space: nowrap;
      margin: 2px 0;
    }
    .left { flex: 1; }
    .right { text-align: right; margin-left: 6px; }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-weight: bold;
    }
    .item-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-qty { width: 15%; text-align: center; }
    .item-price {
      min-width: 24px;
      text-align: right;
      font-weight: bold;
    }
    .pending {
      border: 1px dashed #000;
      padding: 3px;
      margin: 3px 0;
      text-align: center;
      font-weight: bold;
    }
    .waiter-block { margin: 3px 0; padding: 2px 0; }
    .waiter-name { font-weight: bold; text-transform: uppercase; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// ==================== PUBLIC FUNCTIONS ====================

/**
 * Test page HTML generatsiya qilish
 */
export function generateTestReceiptHTML(restaurantName: string = 'KEPKET'): string {
  const content = `
<div class="center header">${restaurantName}</div>
<div class="sep">${SEP}</div>
<div class="center bold">TEST PRINT</div>
<div class="sep">${SEP}</div>
<div class="center">Printer ishlayapti!</div>
<div class="center">${formatDateTime()}</div>
<div class="sep">${SEP}</div>
<div class="center bold footer">*** KEPKET ***</div>
`;
  return generateHTML(content);
}

/**
 * To'lov cheki HTML generatsiya qilish
 */
export function generatePaymentReceiptHTML(data: PaymentData): string {
  const items = data.items || [];
  const isPaid = data.isPaid !== false;

  let itemsHtml = '';
  for (const item of items) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    itemsHtml += `<div class="item-row"><span class="item-name">${item.foodName}</span><span class="item-qty">${item.quantity}</span><span class="item-price">${formatPrice(itemTotal)}</span></div>\n`;
  }

  const paymentTypeText = data.paymentType === 'cash' ? 'NAQD' : data.paymentType === 'card' ? 'KARTA' : data.paymentType.toUpperCase();

  const content = `
<div class="center header">${data.restaurantName || 'RESTORAN'}</div>
${data.restaurantAddress ? `<div class="center">${data.restaurantAddress}</div>` : ''}
<div class="sep">${SEP}</div>
<div class="center bold">${isPaid ? "TO'LOV CHEKI" : "HISOB"}</div>
<div class="sep">${SEP}</div>
<div class="row"><span class="left">Sana:</span><span class="right">${formatDateTime()}</span></div>
<div class="row"><span class="left">Stol:</span><span class="right">${data.tableName || '-'}</span></div>
${data.waiterName ? `<div class="row"><span class="left">Ofitsiant:</span><span class="right">${data.waiterName}</span></div>` : ''}
${data.cashierName ? `<div class="row"><span class="left">Kassir:</span><span class="right">${data.cashierName}</span></div>` : ''}
<div class="sep">${SEP_DOUBLE}</div>
<div class="item-row bold"><span class="item-name">Tovar</span><span class="item-qty">Soni</span><span class="item-price">Summa</span></div>
<div class="sep">${SEP}</div>
${itemsHtml}
<div class="sep">${SEP_DOUBLE}</div>
<div class="row bold"><span class="left">Jami:</span><span class="right">${items.length} ta</span></div>
<div class="row"><span class="left">Taomlar:</span><span class="right">${formatPrice(data.itemsTotal)} so'm</span></div>
${data.serviceFee && data.serviceFee > 0 ? `<div class="row"><span class="left">Xizmat haqi:</span><span class="right">${formatPrice(data.serviceFee)} so'm</span></div>` : ''}
${data.discount && data.discount > 0 ? `<div class="row"><span class="left">Chegirma:</span><span class="right">-${formatPrice(data.discount)} so'm</span></div>` : ''}
<div class="row large"><span class="left">ITOGO:</span><span class="right">${formatPrice(data.totalPrice)} so'm</span></div>
<div class="sep">${SEP}</div>
${isPaid ? `<div class="row"><span class="left">To'lov turi:</span><span class="right bold">${paymentTypeText}</span></div>` : ''}
<div class="sep">${SEP_DOUBLE}</div>
${isPaid ? '<div class="center">Xaridingiz uchun rahmat!</div>' : '<div class="pending">TO\'LOV KUTILMOQDA</div>'}
<div class="sep">${SEP}</div>
<div class="center bold footer">*** KEPKET ***</div>
`;
  return generateHTML(content);
}

/**
 * Kunlik hisobot cheki HTML generatsiya qilish
 */
export function generateReportReceiptHTML(data: ReportData): string {
  const total = data.totalCash + data.totalCard;

  const content = `
<div class="center header">HISOBOT</div>
<div class="center subheader">UMUMIY TUSHUM</div>
<div class="sep">${SEP}</div>
<div class="row"><span class="left">Joyi:</span><span class="right">${data.restaurantName || 'Restoran'}</span></div>
<div class="row"><span class="left">Sana:</span><span class="right">${formatDateTime()}</span></div>
<div class="sep">${SEP_DOUBLE}</div>
<div class="row bold"><span class="left">To'lov turi</span><span class="right">Summa</span></div>
<div class="sep">${SEP}</div>
<div class="row"><span class="left">Naqd pul:</span><span class="right">${formatPrice(data.totalCash)} so'm</span></div>
<div class="row"><span class="left">Plastik karta:</span><span class="right">${formatPrice(data.totalCard)} so'm</span></div>
${data.totalUnpaid !== undefined ? `<div class="row"><span class="left">To'lanmagan:</span><span class="right">${formatPrice(data.totalUnpaid)} so'm</span></div>` : ''}
<div class="sep">${SEP_DOUBLE}</div>
<div class="row large"><span class="left">JAMI TUSHUM:</span><span class="right">${formatPrice(total)} so'm</span></div>
<div class="sep">${SEP}</div>
<div class="center bold footer">*** KEPKET ***</div>
`;
  return generateHTML(content);
}

/**
 * Ofitsiantlar hisoboti HTML generatsiya qilish
 */
export function generateWaiterReportHTML(data: WaiterReportData): string {
  const waiters = data.waiters || [];
  let totalAll = 0;
  waiters.forEach(w => {
    totalAll += (w.cash || 0) + (w.card || 0);
  });

  let waitersHtml = '';
  for (const waiter of waiters) {
    const waiterTotal = (waiter.cash || 0) + (waiter.card || 0);
    waitersHtml += `
<div class="waiter-block">
  <div class="waiter-name">${waiter.name || ''}</div>
  <div class="row"><span class="left">Naqd pul:</span><span class="right">${formatPrice(waiter.cash || 0)}</span></div>
  <div class="row"><span class="left">Plastik:</span><span class="right">${formatPrice(waiter.card || 0)}</span></div>
  <div class="row"><span class="left">To'lanmagan:</span><span class="right">${formatPrice(waiter.unpaid || 0)}</span></div>
  <div class="row bold"><span class="left">JAMI:</span><span class="right">${formatPrice(waiterTotal)}</span></div>
</div>
<div class="sep">${SEP}</div>
`;
  }

  const content = `
<div class="center header">HISOBOT</div>
<div class="center subheader">OFITSIANTLAR BO'YICHA</div>
<div class="sep">${SEP}</div>
<div class="row"><span class="left">Joyi:</span><span class="right">${data.restaurantName || 'Restoran'}</span></div>
<div class="row"><span class="left">Sana:</span><span class="right">${formatDateTime()}</span></div>
<div class="sep">${SEP_DOUBLE}</div>
${waitersHtml}
<div class="sep">${SEP_DOUBLE}</div>
<div class="row large"><span class="left">UMUMIY JAMI:</span><span class="right">${formatPrice(totalAll)} so'm</span></div>
<div class="sep">${SEP}</div>
<div class="center bold footer">*** KEPKET ***</div>
`;
  return generateHTML(content);
}

/**
 * Bekor qilinganlar hisoboti HTML generatsiya qilish
 */
export function generateCancelledReportHTML(data: CancelledReportData): string {
  const items = data.items || [];
  let total = 0;
  items.forEach(item => {
    total += (item.price || 0) * (item.quantity || 1);
  });

  let itemsHtml = '';
  for (const item of items) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    itemsHtml += `<div class="item-row"><span class="item-name">${item.foodName || ''}</span><span class="item-qty">${item.quantity || 1}</span><span class="item-price">${formatPrice(itemTotal)}</span></div>\n`;
  }

  const content = `
<div class="center header">HISOBOT</div>
<div class="center subheader">BEKOR QILINGANLAR</div>
<div class="sep">${SEP}</div>
<div class="row"><span class="left">Joyi:</span><span class="right">${data.restaurantName || 'Restoran'}</span></div>
<div class="row"><span class="left">Sana:</span><span class="right">${formatDateTime()}</span></div>
<div class="sep">${SEP_DOUBLE}</div>
<div class="item-row bold"><span class="item-name">Tovar</span><span class="item-qty">Soni</span><span class="item-price">Summa</span></div>
<div class="sep">${SEP}</div>
${itemsHtml}
<div class="sep">${SEP_DOUBLE}</div>
<div class="row large"><span class="left">JAMI:</span><span class="right">${formatPrice(total)} so'm</span></div>
<div class="sep">${SEP}</div>
<div class="center bold footer">*** KEPKET ***</div>
`;
  return generateHTML(content);
}

// Export types
export type { PaymentData, PaymentItem, ReportData, WaiterReportData, WaiterData, CancelledReportData, CancelledItem };
