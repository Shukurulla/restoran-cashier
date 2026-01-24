'use client';

import { DailySummary } from '@/types';
import { BiDollar, BiPackage, BiMoney, BiCreditCard } from 'react-icons/bi';
import { SiKlarna } from 'react-icons/si';

interface SummaryCardsProps {
  summary: DailySummary;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      icon: BiDollar,
      value: formatMoney(summary.totalRevenue),
      label: 'Kunlik tushum',
      iconBg: 'bg-[#22c55e]/10',
      iconColor: 'text-[#22c55e]',
    },
    {
      icon: BiPackage,
      value: summary.totalOrders.toString(),
      label: 'Jami buyurtmalar',
      iconBg: 'bg-[#3b82f6]/10',
      iconColor: 'text-[#3b82f6]',
    },
    {
      icon: BiMoney,
      value: formatMoney(summary.cashRevenue),
      label: 'Naqd pul',
      iconBg: 'bg-[#eab308]/10',
      iconColor: 'text-[#eab308]',
    },
    {
      icon: BiCreditCard,
      value: formatMoney(summary.cardRevenue),
      label: 'Plastik karta',
      iconBg: 'bg-[#3b82f6]/10',
      iconColor: 'text-[#3b82f6]',
    },
    {
      icon: SiKlarna,
      value: formatMoney(summary.clickRevenue),
      label: 'Click',
      iconBg: 'bg-[#a855f7]/10',
      iconColor: 'text-[#a855f7]',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-card rounded-xl p-5 border border-border hover:border-[#404040] transition-colors"
        >
          <div className="mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              <card.icon className={`text-lg ${card.iconColor}`} />
            </div>
          </div>
          <div className="text-[28px] font-bold mb-1 tabular-nums tracking-tight">
            {card.value}
          </div>
          <div className="text-sm text-[#71717a]">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
