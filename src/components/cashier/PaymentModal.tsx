'use client';

import { useState, useEffect } from 'react';
import { Order, PaymentType, PaymentSplit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BiMoney, BiCreditCard, BiCheck, BiX, BiMessageDetail } from 'react-icons/bi';
import { SiKlarna } from 'react-icons/si';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, paymentType: PaymentType, paymentSplit?: PaymentSplit, comment?: string) => Promise<void>;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

export function PaymentModal({ order, isOpen, onClose, onConfirm }: PaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [singlePaymentType, setSinglePaymentType] = useState<PaymentType>('cash');
  const [splitPayment, setSplitPayment] = useState<PaymentSplit>({ cash: 0, card: 0, click: 0 });
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Order o'zgarganda split payment ni reset qilish
  useEffect(() => {
    if (order) {
      setSplitPayment({ cash: 0, card: 0, click: 0 });
      setComment('');
      setPaymentMode('single');
      setSinglePaymentType('cash');
    }
  }, [order?._id]);

  if (!order) return null;

  const activeItems = order.items.filter(item => item.status !== 'cancelled');
  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = order.grandTotal;

  // Split payment uchun qolgan summa
  const totalSplit = splitPayment.cash + splitPayment.card + splitPayment.click;
  const remaining = grandTotal - totalSplit;

  const handleSplitChange = (type: keyof PaymentSplit, value: string) => {
    const numValue = parseInt(value.replace(/\D/g, '')) || 0;
    setSplitPayment(prev => ({ ...prev, [type]: numValue }));
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (paymentMode === 'split') {
        // Split payment - eng katta qismini asosiy tur sifatida belgilaymiz
        const mainType: PaymentType =
          splitPayment.cash >= splitPayment.card && splitPayment.cash >= splitPayment.click ? 'cash' :
          splitPayment.card >= splitPayment.click ? 'card' : 'click';

        await onConfirm(order._id, mainType, splitPayment, comment || undefined);
      } else {
        await onConfirm(order._id, singlePaymentType, undefined, comment || undefined);
      }
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidPayment = paymentMode === 'single' || (paymentMode === 'split' && Math.abs(remaining) < 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[680px]">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <BiMoney className="text-[#22c55e]" />
            To&apos;lov qabul qilish
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Order Info - bir qatorda */}
          <div className="bg-secondary rounded-xl p-3 flex gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{order.orderType === 'saboy' ? 'Turi:' : 'Stol:'}</span>
              <span className="font-semibold">
                {order.orderType === 'saboy' ? 'Soboy' : order.tableName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ofitsiant:</span>
              <span>{order.waiter.name}</span>
            </div>
          </div>

          {/* Items */}
          <div className="bg-secondary rounded-xl p-3 max-h-[120px] overflow-y-auto">
            {activeItems.map((item) => (
              <div key={item._id} className="flex justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm">
                  <span className="font-medium">{item.quantity}x</span> {item.name}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary - bir qatorda */}
          <div className="bg-secondary rounded-xl p-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Taomlar:</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            {order.orderType !== 'saboy' && order.serviceFee > 0 && (
              <div className="flex items-center gap-2 text-sm text-[#3b82f6] border-l border-border pl-4">
                <span>Xizmat (10%):</span>
                <span className="tabular-nums">{formatMoney(order.serviceFee)}</span>
              </div>
            )}
            <div className={`flex items-center gap-3 ml-auto ${order.orderType !== 'saboy' && order.serviceFee > 0 ? 'border-l border-border pl-4' : ''}`}>
              <span className="font-medium text-sm">Jami:</span>
              <span className="text-xl font-bold text-[#22c55e] tabular-nums">
                {formatMoney(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Mode Toggle + Single Payment Type - bir qatorda */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMode('single')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all
                  ${paymentMode === 'single'
                    ? 'bg-[#22c55e] text-white'
                    : 'bg-secondary border border-border text-muted-foreground hover:border-[#404040]'
                  }`}
              >
                Bir turda
              </button>
              <button
                onClick={() => setPaymentMode('split')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all
                  ${paymentMode === 'split'
                    ? 'bg-[#22c55e] text-white'
                    : 'bg-secondary border border-border text-muted-foreground hover:border-[#404040]'
                  }`}
              >
                Bo&apos;lib to&apos;lash
              </button>
            </div>

            {/* Single Payment Type Selection - horizontal */}
            {paymentMode === 'single' && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSinglePaymentType('cash')}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all
                    ${singlePaymentType === 'cash'
                      ? 'border-[#22c55e] text-[#22c55e] bg-[#22c55e]/5'
                      : 'border-border text-muted-foreground hover:border-[#404040]'
                    }`}
                >
                  <BiMoney className="text-xl" />
                  <span className="text-sm font-medium">Naqd</span>
                </button>
                <button
                  onClick={() => setSinglePaymentType('card')}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all
                    ${singlePaymentType === 'card'
                      ? 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5'
                      : 'border-border text-muted-foreground hover:border-[#404040]'
                    }`}
                >
                  <BiCreditCard className="text-xl" />
                  <span className="text-sm font-medium">Plastik</span>
                </button>
                <button
                  onClick={() => setSinglePaymentType('click')}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all
                    ${singlePaymentType === 'click'
                      ? 'border-[#a855f7] text-[#a855f7] bg-[#a855f7]/5'
                      : 'border-border text-muted-foreground hover:border-[#404040]'
                    }`}
                >
                  <SiKlarna className="text-xl" />
                  <span className="text-sm font-medium">Click</span>
                </button>
              </div>
            )}
          </div>

          {/* Split Payment Inputs - bir qatorda */}
          {paymentMode === 'split' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                {/* Naqd */}
                <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl p-2.5">
                  <div className="w-8 h-8 bg-[#22c55e]/10 rounded-lg flex items-center justify-center text-[#22c55e]">
                    <BiMoney className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Naqd</label>
                    <input
                      type="text"
                      value={splitPayment.cash > 0 ? splitPayment.cash.toLocaleString() : ''}
                      onChange={(e) => handleSplitChange('cash', e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-base font-semibold focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Plastik */}
                <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl p-2.5">
                  <div className="w-8 h-8 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center text-[#3b82f6]">
                    <BiCreditCard className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Plastik</label>
                    <input
                      type="text"
                      value={splitPayment.card > 0 ? splitPayment.card.toLocaleString() : ''}
                      onChange={(e) => handleSplitChange('card', e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-base font-semibold focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Click */}
                <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl p-2.5">
                  <div className="w-8 h-8 bg-[#a855f7]/10 rounded-lg flex items-center justify-center text-[#a855f7]">
                    <SiKlarna className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Click</label>
                    <input
                      type="text"
                      value={splitPayment.click > 0 ? splitPayment.click.toLocaleString() : ''}
                      onChange={(e) => handleSplitChange('click', e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-base font-semibold focus:outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Remaining Amount */}
              <div className={`flex justify-between items-center p-2.5 rounded-xl ${
                Math.abs(remaining) < 100 ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]'
              }`}>
                <span className="text-sm font-medium">Qolgan summa:</span>
                <span className="text-base font-bold tabular-nums">{formatMoney(remaining)}</span>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <BiMessageDetail />
              Izoh (ixtiyoriy):
            </h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="To'lov haqida izoh..."
              rows={2}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-[#3b82f6] resize-none"
            />
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
            disabled={isLoading || !isValidPayment}
            className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white disabled:opacity-50"
          >
            <BiCheck className="mr-2" />
            {isLoading ? 'Kutilmoqda...' : 'To\'lovni tasdiqlash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
