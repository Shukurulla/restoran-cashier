'use client';

import { useState, useEffect } from 'react';
import { Order, OrderItem } from '@/types';
import { BiTable, BiUser, BiCheck, BiPrinter, BiTime, BiLoader, BiPlus } from 'react-icons/bi';
import { MdDeliveryDining } from 'react-icons/md';

// Soatlik to'lovni hisoblash funksiyasi
const calculateHourlyCharge = (order: Order): { hours: number; charge: number } => {
  if (!order.hasHourlyCharge || !order.hourlyChargeAmount || order.hourlyChargeAmount <= 0) {
    return { hours: 0, charge: 0 };
  }

  const createdAt = new Date(order.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Agar hech qanday vaqt o'tmagan bo'lsa ham, 1 soat hisoblanadi
  // Har bir soatdan o'tgan holda yangi soat qo'shiladi
  const hours = Math.max(1, Math.ceil(diffHours));
  const charge = hours * order.hourlyChargeAmount;

  return { hours, charge };
};

interface OrderCardProps {
  order: Order;
  onPayClick: (order: Order) => void;
  onDetailsClick: (order: Order) => void;
  onPrintClick?: (order: Order) => void;
  onAddItemsClick?: (order: Order) => void;
  // Merge mode props
  isMergeMode?: boolean;
  isSelected?: boolean;
  selectionIndex?: number;
  onToggleSelect?: () => void;
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
    case 'cancelled':
      return {
        icon: BiTime,
        text: 'Bekor qilindi',
        className: 'text-[#ef4444]',
        bgClass: 'bg-[#ef4444]/10',
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
  // Bekor qilingan order
  if (order.status === 'cancelled') {
    return { text: 'BEKOR QILINDI', className: 'bg-[#ef4444]/20 text-[#ef4444]' };
  }

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

export function OrderCard({
  order,
  onPayClick,
  onDetailsClick,
  onPrintClick,
  onAddItemsClick,
  isMergeMode = false,
  isSelected = false,
  selectionIndex = -1,
  onToggleSelect,
}: OrderCardProps) {
  // Soatlik to'lovni hisoblash va har daqiqada yangilash
  const [hourlyChargeData, setHourlyChargeData] = useState(() => calculateHourlyCharge(order));

  useEffect(() => {
    // Agar soatlik to'lov bo'lmasa yoki order to'langan bo'lsa, yangilamaslik
    if (!order.hasHourlyCharge || order.paymentStatus === 'paid') {
      return;
    }

    // Dastlabki hisoblash
    setHourlyChargeData(calculateHourlyCharge(order));

    // Har daqiqada yangilash
    const interval = setInterval(() => {
      setHourlyChargeData(calculateHourlyCharge(order));
    }, 60000); // 1 daqiqa

    return () => clearInterval(interval);
  }, [order.createdAt, order.hasHourlyCharge, order.hourlyChargeAmount, order.paymentStatus]);

  const status = getStatusBadge(order);
  // isDeleted itemlarni chiqarish, cancelled itemlarni ko'rsatamiz (usti chizilgan holda)
  const allItems = order.items.filter(item => !item.isDeleted);
  const activeItems = allItems.filter(item => item.status !== 'cancelled');
  const cancelledItems = allItems.filter(item => item.status === 'cancelled');

  // To'langan va to'lanmagan itemlarni ajratish (faqat active itemlardan)
  const paidItems = activeItems.filter(item => item.isPaid);
  const unpaidItems = activeItems.filter(item => !item.isPaid);

  // Display uchun - avval unpaid, keyin paid, oxirida cancelled
  const displayItems = [...unpaidItems, ...paidItems, ...cancelledItems].slice(0, 4);
  const remainingCount = allItems.length - 4;

  // To'lanmagan itemlar summasi
  const unpaidSubtotal = unpaidItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paidSubtotal = paidItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Xizmat haqi - faqat to'lanmagan itemlar uchun
  const isSaboy = order.orderType === 'saboy';
  const unpaidServiceFee = isSaboy ? 0 : Math.round(unpaidSubtotal * 0.1);

  // Soatlik to'lov
  const hourlyCharge = hourlyChargeData.charge;

  // To'langan order uchun - backend dan kelgan grandTotal ishlatiladi
  // To'lanmagan order uchun - hisoblash
  const isFullyPaid = order.paymentStatus === 'paid';
  const unpaidTotal = isFullyPaid
    ? order.grandTotal  // Backend dan kelgan to'g'ri summa (hourlyCharge bilan)
    : unpaidSubtotal + unpaidServiceFee + hourlyCharge;

  // Status statistics - faqat to'lanmagan itemlar uchun
  const pendingCount = unpaidItems.filter(i => i.status === 'pending').length;
  const preparingCount = unpaidItems.filter(i => i.status === 'preparing').length;
  const readyCount = unpaidItems.filter(i => i.status === 'ready').length;
  const servedCount = unpaidItems.filter(i => i.status === 'served').length;
  const paidCount = paidItems.length;

  // To'langan orderlarni merge qilib bo'lmaydi
  const canBeMerged = order.paymentStatus !== 'paid';

  const handleCardClick = () => {
    if (isMergeMode && canBeMerged) {
      onToggleSelect?.();
    } else if (!isMergeMode) {
      onDetailsClick(order);
    }
  };

  return (
    <div
      className={`bg-secondary rounded-xl border overflow-hidden transition-all cursor-pointer relative
        ${isMergeMode
          ? isSelected
            ? 'border-[#a855f7] border-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            : canBeMerged
              ? 'border-dashed border-2 border-[#a855f7]/50 hover:border-[#a855f7]'
              : 'border-border opacity-50 cursor-not-allowed'
          : 'border-border hover:border-[#404040] hover:-translate-y-0.5'
        }`}
      onClick={handleCardClick}
    >
      {/* Selection indicator */}
      {isMergeMode && isSelected && (
        <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-[#a855f7] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {selectionIndex === 0 ? '★' : selectionIndex + 1}
        </div>
      )}

      {/* First selected badge */}
      {isMergeMode && isSelected && selectionIndex === 0 && (
        <div className="absolute top-0 left-0 right-0 bg-[#a855f7] text-white text-xs font-semibold py-1 px-3 text-center">
          ASOSIY BUYURTMA
        </div>
      )}

      {/* Header */}
      <div className={`px-5 py-4 flex justify-between items-center border-b border-border ${isMergeMode && isSelected && selectionIndex === 0 ? 'pt-8' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg
            ${isMergeMode && isSelected ? 'bg-[#a855f7]/20 text-[#a855f7]' : 'bg-[#262626] text-[#3b82f6]'}`}>
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
        {!isMergeMode && (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${status.className}`}>
            {status.text}
          </span>
        )}
      </div>

      {/* Status Progress Bar */}
      {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && activeItems.length > 0 && !isMergeMode && (
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
          {paidCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#22c55e]/20 text-[#22c55e] ml-auto">
              <BiCheck className="text-xs" />
              <span>{paidCount} to'langan</span>
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
            const isPaidItem = item.isPaid;
            const isCancelledItem = item.status === 'cancelled';
            const isDisabled = isPaidItem || isCancelledItem;

            return (
              <div
                key={item._id}
                className={`flex justify-between items-center py-2 ${index > 0 ? 'border-t border-border' : ''} ${isDisabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold min-w-[32px] text-center tabular-nums ${
                    isCancelledItem ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                    isPaidItem ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#262626] text-foreground'
                  }`}>
                    {item.quantity}x
                  </span>
                  <span className={isDisabled ? 'line-through text-[#71717a]' : itemStatus.className}>{item.name}</span>
                  {isCancelledItem ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] font-medium">BEKOR QILINDI</span>
                  ) : isPaidItem ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] font-medium">TO'LANGAN</span>
                  ) : (
                    !isMergeMode && <StatusIcon className={`${itemStatus.className} text-sm`} />
                  )}
                </div>
                <span className={`text-sm tabular-nums ${isDisabled ? 'line-through text-[#71717a]' : 'text-muted-foreground'}`}>
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
          {/* To'liq to'langan order uchun sodda ko'rinish */}
          {isFullyPaid ? (
            <>
              {/* Bandlik haqi bo'lsa ko'rsatish */}
              {order.hourlyCharge && order.hourlyCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#a855f7]">
                    <BiTime className="inline mr-1" />
                    Bandlik ({order.hourlyChargeHours || 1} soat):
                  </span>
                  <span className="text-[#a855f7] tabular-nums">{formatMoney(order.hourlyCharge)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold text-[#22c55e]">To'langan:</span>
                <span className="text-lg font-bold tabular-nums text-[#22c55e]">
                  {formatMoney(order.grandTotal)}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Agar qisman to'langan itemlar bo'lsa */}
              {paidSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#22c55e]">To'langan:</span>
                  <span className="text-[#22c55e] tabular-nums line-through">{formatMoney(paidSubtotal + (isSaboy ? 0 : Math.round(paidSubtotal * 0.1)))}</span>
                </div>
              )}
              {/* Qolgan to'lanmagan summa */}
              <div className="flex justify-between text-sm">
                <span className="text-[#71717a]">{paidSubtotal > 0 ? 'Qolgan taomlar:' : 'Taomlar:'}</span>
                <span className="text-muted-foreground tabular-nums">{formatMoney(unpaidSubtotal)}</span>
              </div>
              {!isSaboy && unpaidServiceFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#3b82f6]">Xizmat haqi (10%):</span>
                  <span className="text-[#3b82f6] tabular-nums">{formatMoney(unpaidServiceFee)}</span>
                </div>
              )}
              {/* Soatlik to'lov */}
              {hourlyCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#a855f7]">
                    <BiTime className="inline mr-1" />
                    Bandlik ({hourlyChargeData.hours} soat):
                  </span>
                  <span className="text-[#a855f7] tabular-nums">{formatMoney(hourlyCharge)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold">{paidSubtotal > 0 ? 'Qolgan summa:' : 'Jami:'}</span>
                <span className={`text-lg font-bold tabular-nums ${isMergeMode && isSelected ? 'text-[#a855f7]' : 'text-[#22c55e]'}`}>
                  {formatMoney(unpaidTotal)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions - faqat merge mode bo'lmaganda */}
      {!isMergeMode && (
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
          {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && onAddItemsClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddItemsClick(order);
              }}
              className="py-2.5 px-4 bg-[#262626] border border-[#3b82f6] rounded-lg text-[#3b82f6] text-sm font-semibold hover:bg-[#3b82f6]/10 transition-colors flex items-center gap-1"
            >
              <BiPlus className="text-lg" />
            </button>
          )}
          {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
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
      )}

      {/* Merge mode selection hint */}
      {isMergeMode && canBeMerged && !isSelected && (
        <div className="px-5 py-3 bg-[#a855f7]/5 text-center">
          <span className="text-xs text-[#a855f7]">Tanlash uchun bosing</span>
        </div>
      )}
    </div>
  );
}
