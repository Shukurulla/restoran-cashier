'use client';

import { useState } from 'react';
import { Order, FilterType } from '@/types';
import { OrderCard } from './OrderCard';
import { BiListUl, BiArchive, BiGitMerge, BiX, BiCheck, BiLoader } from 'react-icons/bi';
import { api } from '@/services/api';

interface OrdersSectionProps {
  orders: Order[];
  onPayClick: (order: Order) => void;
  onDetailsClick: (order: Order) => void;
  onPrintClick?: (order: Order) => void;
  onMergeSuccess?: () => void;
}

export function OrdersSection({ orders, onPayClick, onDetailsClick, onPrintClick, onMergeSuccess }: OrdersSectionProps) {
  const [filter, setFilter] = useState<FilterType>('active');
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const activeOrders = orders.filter(o => o.paymentStatus !== 'paid');
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');

  const filteredOrders = filter === 'active'
    ? activeOrders
    : filter === 'paid'
      ? paidOrders
      : orders;

  const filters = [
    { key: 'active' as FilterType, label: 'Tayyorlanmoqda', count: activeOrders.length },
    { key: 'paid' as FilterType, label: 'To\'langan', count: paidOrders.length },
    { key: 'all' as FilterType, label: 'Barchasi', count: orders.length },
  ];

  // Merge mode funksiyalari
  const toggleMergeMode = () => {
    if (isMergeMode) {
      // Merge modeni o'chirish
      setIsMergeMode(false);
      setSelectedOrderIds([]);
    } else {
      // Merge modeni yoqish - faqat aktiv orderlar uchun
      setFilter('active');
      setIsMergeMode(true);
      setSelectedOrderIds([]);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      }
      return [...prev, orderId];
    });
  };

  const handleMergeOrders = async () => {
    if (selectedOrderIds.length < 2) {
      alert('Kamida 2 ta buyurtma tanlang');
      return;
    }

    // Birinchi tanlangan order target bo'ladi
    const targetOrderId = selectedOrderIds[0];
    const sourceOrderIds = selectedOrderIds.slice(1);

    try {
      setIsMerging(true);
      const result = await api.mergeOrders(targetOrderId, sourceOrderIds);

      if (result.success) {
        alert(result.message);
        setIsMergeMode(false);
        setSelectedOrderIds([]);
        onMergeSuccess?.();
      }
    } catch (error) {
      console.error('Birlashtirish xatosi:', error);
      alert(error instanceof Error ? error.message : 'Birlashtirish amalga oshirilmadi');
    } finally {
      setIsMerging(false);
    }
  };

  // Tanlangan orderlarning umumiy summasi
  const selectedOrders = orders.filter(o => selectedOrderIds.includes(o._id));
  const totalSelectedAmount = selectedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold flex items-center gap-2.5">
          <BiListUl className="text-lg" />
          Buyurtmalar
        </h2>

        <div className="flex items-center gap-3">
          {/* Merge mode button */}
          {!isMergeMode ? (
            <button
              onClick={toggleMergeMode}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-[#a855f7]/10 text-[#a855f7] hover:bg-[#a855f7]/20 transition-colors"
            >
              <BiGitMerge className="text-lg" />
              Biriktirish
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMergeMode}
                className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
              >
                <BiX className="text-lg" />
                Bekor qilish
              </button>
              <button
                onClick={handleMergeOrders}
                disabled={selectedOrderIds.length < 2 || isMerging}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                  ${selectedOrderIds.length >= 2
                    ? 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
                    : 'bg-[#262626] text-[#71717a] cursor-not-allowed'
                  }`}
              >
                {isMerging ? (
                  <BiLoader className="text-lg animate-spin" />
                ) : (
                  <BiCheck className="text-lg" />
                )}
                Biriktirish ({selectedOrderIds.length})
              </button>
            </div>
          )}

          {/* Filters - faqat merge mode bo'lmaganda */}
          {!isMergeMode && (
            <div className="flex gap-1 bg-secondary p-1 rounded-lg">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all
                    ${filter === f.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded text-[11px] min-w-[20px] text-center
                    ${filter === f.key ? 'bg-[#3b82f6] text-white' : 'bg-[#262626]'}`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Merge mode info banner */}
      {isMergeMode && (
        <div className="px-5 py-3 bg-[#a855f7]/10 border-b border-[#a855f7]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BiGitMerge className="text-[#a855f7] text-xl" />
            <div>
              <p className="text-sm font-medium text-[#a855f7]">Biriktirish rejimi</p>
              <p className="text-xs text-[#a855f7]/70">
                Birinchi tanlangan buyurtmaga boshqalari qo&apos;shiladi. Kamida 2 ta buyurtma tanlang.
              </p>
            </div>
          </div>
          {selectedOrderIds.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-[#a855f7]">{selectedOrderIds.length} ta tanlandi</p>
              <p className="text-lg font-bold text-[#a855f7]">{totalSelectedAmount.toLocaleString('uz-UZ')} so&apos;m</p>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 min-h-[300px]">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-3xl text-[#71717a] mb-5">
              <BiArchive />
            </div>
            <h3 className="text-lg font-semibold mb-2">Buyurtmalar yo&apos;q</h3>
            <p className="text-[#71717a] text-sm">
              {filter === 'active' && 'Hozirda faol buyurtmalar mavjud emas'}
              {filter === 'paid' && 'Bugun to\'langan buyurtmalar yo\'q'}
              {filter === 'all' && 'Buyurtmalar kelganda bu yerda ko\'rinadi'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onPayClick={onPayClick}
                onDetailsClick={onDetailsClick}
                onPrintClick={onPrintClick}
                isMergeMode={isMergeMode}
                isSelected={selectedOrderIds.includes(order._id)}
                selectionIndex={selectedOrderIds.indexOf(order._id)}
                onToggleSelect={() => toggleOrderSelection(order._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
