'use client';

import { Order } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BiListUl, BiUser, BiTime, BiCheck, BiX, BiMoney } from 'react-icons/bi';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPayClick: (order: Order) => void;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function OrderDetailsModal({ order, isOpen, onClose, onPayClick }: OrderDetailsModalProps) {
  if (!order) return null;

  const activeItems = order.items.filter(item => item.status !== 'cancelled');
  const cancelledItems = order.items.filter(item => item.status === 'cancelled');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <BiListUl className="text-[#3b82f6]" />
            {order.orderType === 'saboy' ? 'Soboy' : order.tableName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Order Info */}
          <div className="bg-secondary rounded-xl p-4 space-y-1">
            <div className="flex justify-between py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <BiUser /> Ofitsiant:
              </span>
              <span>{order.waiter.name}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <BiTime /> Vaqt:
              </span>
              <span>{formatTime(order.createdAt)}</span>
            </div>
          </div>

          {/* Items */}
          <div className="bg-secondary rounded-xl p-4 max-h-[350px] overflow-y-auto">
            {activeItems.map((item) => (
              <div
                key={item._id}
                className={`flex items-center gap-3 py-2.5 border-b border-border last:border-0
                  ${item.status === 'ready' ? 'text-[#22c55e]' : ''}`}
              >
                <span className="bg-[#262626] px-2.5 py-1 rounded-md text-sm font-semibold text-foreground min-w-[36px] text-center">
                  {item.quantity}x
                </span>
                <span className="flex-1 text-sm">{item.name}</span>
                {item.status === 'ready' && <BiCheck className="text-[#22c55e]" />}
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </div>
            ))}

            {/* Cancelled Items */}
            {cancelledItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-semibold text-[#ef4444] uppercase block mb-2">
                  Bekor qilingan taomlar
                </span>
                {cancelledItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 py-2.5 opacity-60"
                  >
                    <span className="bg-[#262626] px-2.5 py-1 rounded-md text-sm font-semibold text-foreground min-w-[36px] text-center">
                      {item.quantity}x
                    </span>
                    <span className="flex-1 text-sm line-through text-[#71717a]">{item.name}</span>
                    <BiX className="text-[#ef4444]" />
                    <span className="text-sm text-muted-foreground tabular-nums line-through">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
            <span className="text-base">Jami:</span>
            <span className="text-2xl font-bold tabular-nums">{formatMoney(order.grandTotal)}</span>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Yopish
          </Button>
          {order.paymentStatus !== 'paid' && (
            <Button
              onClick={() => {
                onClose();
                onPayClick(order);
              }}
              className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white"
            >
              <BiMoney className="mr-2" />
              To&apos;lov qabul qilish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
