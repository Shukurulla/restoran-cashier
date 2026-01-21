'use client';

import { Order } from '@/types';
import { BiTable, BiUser, BiCheck } from 'react-icons/bi';

interface OrderCardProps {
  order: Order;
  onPayClick: (order: Order) => void;
  onDetailsClick: (order: Order) => void;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

const getStatusBadge = (order: Order) => {
  if (order.paymentStatus === 'paid') {
    return { text: 'TO\'LANGAN', className: 'bg-[#22c55e]/20 text-[#22c55e]' };
  }
  const allReady = order.items.every(item => item.status === 'ready' || item.status === 'served');
  if (allReady) {
    return { text: 'TAYYOR', className: 'bg-[#22c55e]/15 text-[#22c55e]' };
  }
  return { text: 'TAYYORLANMOQDA', className: 'bg-[#3b82f6]/15 text-[#3b82f6]' };
};

export function OrderCard({ order, onPayClick, onDetailsClick }: OrderCardProps) {
  const status = getStatusBadge(order);
  const activeItems = order.items.filter(item => item.status !== 'cancelled');
  const displayItems = activeItems.slice(0, 3);
  const remainingCount = activeItems.length - 3;

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            <h3 className="text-[15px] font-semibold">{order.tableName}</h3>
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

      {/* Items */}
      <div className="px-5 py-4">
        <div className="mb-4">
          {displayItems.map((item, index) => (
            <div
              key={item._id}
              className={`flex justify-between items-center py-2 ${index > 0 ? 'border-t border-border' : ''}`}
            >
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="bg-[#262626] px-2.5 py-1 rounded-md text-xs font-semibold text-foreground min-w-[32px] text-center tabular-nums">
                  {item.quantity}x
                </span>
                <span className={item.status === 'ready' ? 'text-[#22c55e]' : ''}>{item.name}</span>
                {item.status === 'ready' && <BiCheck className="text-[#22c55e]" />}
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatMoney(item.price * item.quantity)}
              </span>
            </div>
          ))}
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
          <div className="flex justify-between text-sm">
            <span className="text-[#3b82f6]">Xizmat haqi (10%):</span>
            <span className="text-[#3b82f6] tabular-nums">{formatMoney(order.serviceFee)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-sm font-semibold">Jami:</span>
            <span className="text-lg font-bold text-[#22c55e] tabular-nums">{formatMoney(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {order.paymentStatus !== 'paid' && (
        <div className="px-5 py-3 bg-secondary flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPayClick(order);
            }}
            className="flex-1 py-2.5 px-4 bg-[#22c55e] rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            To&apos;lov qabul qilish
          </button>
        </div>
      )}
    </div>
  );
}
