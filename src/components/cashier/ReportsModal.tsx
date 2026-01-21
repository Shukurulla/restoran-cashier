'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PrinterAPI } from '@/services/printer';
import { api } from '@/services/api';
import { DailySummary } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BiFile, BiCalendar, BiGroup, BiXCircle } from 'react-icons/bi';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DailySummary;
}

export function ReportsModal({ isOpen, onClose, summary }: ReportsModalProps) {
  const { restaurant } = useAuth();
  const [isPrinting, setIsPrinting] = useState<string | null>(null);

  const handlePrintDailyReport = async () => {
    setIsPrinting('daily');
    try {
      const selectedPrinter = localStorage.getItem('selectedPrinter') || undefined;
      const result = await PrinterAPI.printDailyReport({
        restaurantName: restaurant?.name || 'Restoran',
        date: new Date().toLocaleDateString('uz-UZ'),
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
        cashRevenue: summary.cashRevenue,
        cardRevenue: summary.cardRevenue,
      }, selectedPrinter);

      if (!result.success) {
        alert('Hisobot chop etish xatoligi: ' + result.error);
      }
    } catch (error) {
      alert('Printer server bilan bog\'lanib bo\'lmadi');
    } finally {
      setIsPrinting(null);
    }
  };

  const handlePrintWaiterReport = async () => {
    setIsPrinting('waiter');
    try {
      const stats = await api.getWaiterStats();
      const selectedPrinter = localStorage.getItem('selectedPrinter') || undefined;
      const result = await PrinterAPI.printDailyReport({
        restaurantName: restaurant?.name || 'Restoran',
        date: new Date().toLocaleDateString('uz-UZ'),
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
        cashRevenue: summary.cashRevenue,
        cardRevenue: summary.cardRevenue,
        waiterStats: stats,
      }, selectedPrinter);

      if (!result.success) {
        alert('Hisobot chop etish xatoligi: ' + result.error);
      }
    } catch (error) {
      alert('Hisobot tayyorlashda xatolik');
    } finally {
      setIsPrinting(null);
    }
  };

  const reports = [
    {
      id: 'daily',
      icon: BiCalendar,
      label: 'Kunlik tushum hisoboti',
      onClick: handlePrintDailyReport,
    },
    {
      id: 'waiter',
      icon: BiGroup,
      label: 'Ofitsiantlar bo\'yicha',
      onClick: handlePrintWaiterReport,
    },
    {
      id: 'cancelled',
      icon: BiXCircle,
      label: 'Bekor qilinganlar',
      onClick: () => alert('Bu funksiya hali tayyor emas'),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <BiFile className="text-[#3b82f6]" />
            Hisobotlar
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={report.onClick}
              disabled={isPrinting !== null}
              className="w-full flex items-center gap-4 p-4 bg-secondary border border-border rounded-xl text-foreground text-[15px] font-medium hover:bg-[#262626] hover:border-[#404040] transition-all disabled:opacity-50"
            >
              <report.icon className="text-xl text-[#3b82f6]" />
              <span>{isPrinting === report.id ? 'Chop etilmoqda...' : report.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
