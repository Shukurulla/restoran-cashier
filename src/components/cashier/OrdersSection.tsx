'use client';

import { useState } from 'react';
import { Order, FilterType } from '@/types';
import { OrderCard } from './OrderCard';
import { BiListUl, BiArchive } from 'react-icons/bi';

interface OrdersSectionProps {
  orders: Order[];
  onPayClick: (order: Order) => void;
  onDetailsClick: (order: Order) => void;
}

export function OrdersSection({ orders, onPayClick, onDetailsClick }: OrdersSectionProps) {
  const [filter, setFilter] = useState<FilterType>('active');

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

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold flex items-center gap-2.5">
          <BiListUl className="text-lg" />
          Buyurtmalar
        </h2>

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
      </div>

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
