'use client';

import { Order, OrderItem } from '@/types';
import { BiTable, BiUser, BiCheck, BiPrinter, BiTime, BiLoader } from 'react-icons/bi';
import { MdDeliveryDining } from 'react-icons/md';

interface OrderCardProps {
  order: Order;
  onPayClick: (order: Order) => void;
  onDetailsClick: (order: Order) => void;
  onPrintClick?: (order: Order) => void;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

// Item status uchun badge
const getItemStatusBadge = (status: OrderItem['status']) => {
  switch (status) {
    case 'pending':
      return {
        icon: BiTime,
        text: 'Kutilmoqda',
        className: 'text-[#71717a]',
        bgClass: 'bg-[#71717a]/10',
      };
    case 'preparing':
      return {
        icon: BiLoader,
        text: 'Tayyorlanmoqda',
        className: 'text-[#eab308]',
        bgClass: 'bg-[#eab308]/10',
      };
    case 'ready':
      return {
        icon: BiCheck,
        text: 'Tayyor',
        className: 'text-[#22c55e]',
        bgClass: 'bg-[#22c55e]/10',
      };
    case 'served':
      return {
        icon: MdDeliveryDining,
        text: 'Yetkazildi',
        className: 'text-[#3b82f6]',
        bgClass: 'bg-[#3b82f6]/10',
      };
    default:
      return {
        icon: BiTime,
        text: status,
        className: 'text-[#71717a]',
        bgClass: 'bg-[#71717a]/10',
      };
  }
};

// Order status uchun badge
const getStatusBadge = (order: Order) => {
  if (order.paymentStatus === 'paid') {
    return { text: 'TO\'LANGAN', className: 'bg-[#22c55e]/20 text-[#22c55e]' };
  }

  const activeItems = order.items.filter(item => item.status !== 'cancelled');
  const allServed = activeItems.every(item => item.status === 'served');
  const allReady = activeItems.every(item => item.status === 'ready' || item.status === 'served');
  const anyPreparing = activeItems.some(item => item.status === 'preparing');

  if (allServed) {
    return { text: 'YETKAZILDI', className: 'bg-[#3b82f6]/20 text-[#3b82f6]' };
  }
  if (allReady) {
    return { text: 'TAYYOR', className: 'bg-[#22c55e]/15 text-[#22c55e]' };
  }
  if (anyPreparing) {
    return { text: 'TAYYORLANMOQDA', className: 'bg-[#eab308]/15 text-[#eab308]' };
  }
  return { text: 'KUTILMOQDA', className: 'bg-[#71717a]/15 text-[#71717a]' };
};

export function OrderCard({ order, onPayClick, onDetailsClick, onPrintClick }: OrderCardProps) {
  const status = getStatusBadge(order);
  const activeItems = order.items.filter(item => item.status !== 'cancelled');
  const displayItems = activeItems.slice(0, 3);
  const remainingCount = activeItems.length - 3;

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Status statistics
  const pendingCount = activeItems.filter(i => i.status === 'pending').length;
  const preparingCount = activeItems.filter(i => i.status === 'preparing').length;
  const readyCount = activeItems.filter(i => i.status === 'ready').length;
  const servedCount = activeItems.filter(i => i.status === 'served').length;

  return (
    <div
      className="bg-secondary rounded-xl border border-border overflow-hidden hover:border-[#404040] hover:-translate-y-0.5 transition-all cursor-pointer"
      onClick={() => onDetailsClick(order)}
    >
      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#262626] rounded-lg flex items-center justify-center text-[#3b82f6] text-lg">
            <BiTable />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold">
              {order.orderType === 'saboy' ? 'Soboy' : order.tableName}
            </h3>
            <div className="flex items-center gap-1 text-xs text-[#71717a] mt-0.5">
              <BiUser />
              <span>{order.waiter.name}</span>
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${status.className}`}>
          {status.text}
        </span>
      </div>

      {/* Status Progress Bar */}
      {order.paymentStatus !== 'paid' && activeItems.length > 0 && (
        <div className="px-5 py-2 bg-[#1a1a1a] flex gap-1 text-[10px]">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#71717a]/10 text-[#71717a]">
              <BiTime className="text-xs" />
              <span>{pendingCount}</span>
            </div>
          )}
          {preparingCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#eab308]/10 text-[#eab308]">
              <BiLoader className="text-xs animate-spin" />
              <span>{preparingCount}</span>
            </div>
          )}
          {readyCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#22c55e]/10 text-[#22c55e]">
              <BiCheck className="text-xs" />
              <span>{readyCount}</span>
            </div>
          )}
          {servedCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#3b82f6]/10 text-[#3b82f6]">
              <MdDeliveryDining className="text-xs" />
              <span>{servedCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="px-5 py-4">
        <div className="mb-4">
          {displayItems.map((item, index) => {
            const itemStatus = getItemStatusBadge(item.status);
            const StatusIcon = itemStatus.icon;

            return (
              <div
                key={item._id}
                className={`flex justify-between items-center py-2 ${index > 0 ? 'border-t border-border' : ''}`}
              >
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className="bg-[#262626] px-2.5 py-1 rounded-md text-xs font-semibold text-foreground min-w-[32px] text-center tabular-nums">
                    {item.quantity}x
                  </span>
                  <span className={itemStatus.className}>{item.name}</span>
                  <StatusIcon className={`${itemStatus.className} text-sm`} />
                </div>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
          {remainingCount > 0 && (
            <button className="w-full py-2.5 mt-2 bg-secondary border border-dashed border-border rounded-lg text-[#3b82f6] text-sm font-medium hover:bg-[#262626] hover:border-[#3b82f6] transition-colors">
              +{remainingCount} ta boshqa taom
            </button>
          )}
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-[#71717a]">Taomlar:</span>
            <span className="text-muted-foreground tabular-nums">{formatMoney(subtotal)}</span>
          </div>
          {order.orderType !== 'saboy' && order.serviceFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#3b82f6]">Xizmat haqi (10%):</span>
              <span className="text-[#3b82f6] tabular-nums">{formatMoney(order.serviceFee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-sm font-semibold">Jami:</span>
            <span className="text-lg font-bold text-[#22c55e] tabular-nums">{formatMoney(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 bg-secondary flex gap-2">
        {onPrintClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrintClick(order);
            }}
            className="py-2.5 px-4 bg-[#262626] border border-border rounded-lg text-muted-foreground text-sm font-semibold hover:bg-[#303030] hover:text-foreground transition-colors flex items-center gap-2"
          >
            <BiPrinter className="text-lg" />
            Chek
          </button>
        )}
        {order.paymentStatus !== 'paid' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPayClick(order);
            }}
            className="flex-1 py-2.5 px-4 bg-[#22c55e] rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            To&apos;lov qabul qilish
          </button>
        )}
      </div>
    </div>
  );
}
