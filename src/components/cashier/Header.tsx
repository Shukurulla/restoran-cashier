'use client';

import { useAuth } from '@/context/AuthContext';
import { DailySummary, Shift } from '@/types';
import { BiCog, BiPrinter, BiUser, BiRefresh, BiPackage, BiTime } from 'react-icons/bi';

interface HeaderProps {
  summary: DailySummary;
  isConnected: boolean;
  activeShift: Shift | null;
  onSettingsClick: () => void;
  onReportsClick: () => void;
  onSaboyClick: () => void;
}

export function Header({ summary, isConnected, activeShift, onSettingsClick, onReportsClick, onSaboyClick }: HeaderProps) {
  const { user, restaurant } = useAuth();

  return (
    <header className="flex justify-between items-center py-4 mb-8 border-b border-border">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Kepket" className="w-[100px] h-auto" />
        <h1 className="text-xl font-semibold tracking-tight">Kassir Panel</h1>
        {restaurant && (
          <span className="px-4 py-1.5 bg-secondary rounded-full text-sm text-muted-foreground font-medium">
            {restaurant.name}
          </span>
        )}
      </div>

      <div className="flex gap-8">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums">{summary.totalOrders}</span>
          <span className="text-xs text-[#71717a] uppercase tracking-wider">JAMI BUYURTMALAR</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums text-[#eab308]">{summary.activeOrders}</span>
          <span className="text-xs text-[#71717a] uppercase tracking-wider">TO&apos;LANMAGAN</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums text-[#22c55e]">{summary.paidOrders}</span>
          <span className="text-xs text-[#71717a] uppercase tracking-wider">TO&apos;LANGAN</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Shift status */}
        {activeShift ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]">
            <BiTime className="text-lg" />
            <span>Smena #{activeShift.shiftNumber}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]">
            <BiTime className="text-lg" />
            <span>Smena ochilmagan</span>
          </div>
        )}

        <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-secondary border border-border ${isConnected ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e] shadow-[0_0_8px_#22c55e]' : 'bg-[#ef4444]'}`} />
          <span>{isConnected ? 'Ulangan' : 'Ulanmagan'}</span>
        </div>

        <button
          onClick={onSaboyClick}
          disabled={!activeShift}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeShift
              ? 'bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] hover:bg-[#f97316]/20 hover:border-[#f97316]'
              : 'bg-secondary border border-border text-muted-foreground cursor-not-allowed opacity-50'
          }`}
          title={!activeShift ? 'Smena ochilmagan' : undefined}
        >
          <BiPackage className="text-lg" />
          Saboy
        </button>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg text-[#3b82f6] text-sm font-medium hover:bg-[#3b82f6]/20 hover:border-[#3b82f6] transition-colors"
        >
          <BiRefresh className="text-lg" />
          Yangilash
        </button>

        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-muted-foreground text-sm font-medium hover:bg-[#262626] hover:text-foreground transition-colors"
        >
          <BiCog className="text-lg" />
        </button>

        <button
          onClick={onReportsClick}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-muted-foreground text-sm font-medium hover:bg-[#262626] hover:text-foreground transition-colors"
        >
          <BiPrinter className="text-lg" />
          Hisobotlar
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg text-muted-foreground text-sm font-medium">
          <BiUser className="text-lg" />
          <span>{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
