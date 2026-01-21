'use client';

import { useState } from 'react';
import { Order } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BiMoney, BiCreditCard, BiCheck, BiX } from 'react-icons/bi';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, paymentType: 'cash' | 'card') => Promise<void>;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

export function PaymentModal({ order, isOpen, onClose, onConfirm }: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [isLoading, setIsLoading] = useState(false);

  if (!order) return null;

  const activeItems = order.items.filter(item => item.status !== 'cancelled');
  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(order._id, paymentType);
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <BiMoney className="text-[#22c55e]" />
            To&apos;lov qabul qilish
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Order Info */}
          <div className="bg-secondary rounded-xl p-4">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-muted-foreground">Stol:</span>
              <span className="font-semibold">{order.tableName}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-muted-foreground">Ofitsiant:</span>
              <span>{order.waiter.name}</span>
            </div>
          </div>

          {/* Items */}
          <div className="bg-secondary rounded-xl p-4 max-h-[200px] overflow-y-auto">
            {activeItems.map((item) => (
              <div key={item._id} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">
                  <span className="font-medium">{item.quantity}x</span> {item.name}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-secondary rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Taomlar summasi:</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#3b82f6] pb-3 border-b border-border">
              <span>Xizmat haqi (10%):</span>
              <span className="tabular-nums">{formatMoney(order.serviceFee)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-medium">Jami to&apos;lov:</span>
              <span className="text-2xl font-bold text-[#22c55e] tabular-nums">
                {formatMoney(order.grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">To&apos;lov turi:</h4>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentType('cash')}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${paymentType === 'cash'
                    ? 'border-[#22c55e] text-[#22c55e] bg-[#22c55e]/5'
                    : 'border-border text-muted-foreground hover:border-[#404040]'
                  }`}
              >
                <BiMoney className="text-2xl" />
                <span className="text-sm font-medium">Naqd pul</span>
              </button>
              <button
                onClick={() => setPaymentType('card')}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${paymentType === 'card'
                    ? 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5'
                    : 'border-border text-muted-foreground hover:border-[#404040]'
                  }`}
              >
                <BiCreditCard className="text-2xl" />
                <span className="text-sm font-medium">Plastik karta</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            <BiX className="mr-2" />
            Bekor qilish
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white"
          >
            <BiCheck className="mr-2" />
            {isLoading ? 'Kutilmoqda...' : 'To\'lovni tasdiqlash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
