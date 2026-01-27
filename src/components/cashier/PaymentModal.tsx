'use client';

import { useState, useEffect, useMemo } from 'react';
import { Order, PaymentType, PaymentSplit, PartialPaymentResult } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BiMoney, BiCreditCard, BiCheck, BiX, BiMessageDetail, BiCheckCircle, BiTime } from 'react-icons/bi';
import { SiKlarna } from 'react-icons/si';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, paymentType: PaymentType, paymentSplit?: PaymentSplit, comment?: string) => Promise<void>;
  onPartialConfirm?: (orderId: string, itemIds: string[], paymentType: PaymentType, paymentSplit?: PaymentSplit, comment?: string) => Promise<PartialPaymentResult>;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

// Soatlik to'lovni hisoblash funksiyasi
const calculateHourlyCharge = (order: Order | null): { hours: number; charge: number } => {
  if (!order || !order.hasHourlyCharge || !order.hourlyChargeAmount || order.hourlyChargeAmount <= 0) {
    return { hours: 0, charge: 0 };
  }

  const createdAt = new Date(order.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Agar hech qanday vaqt o'tmagan bo'lsa ham, 1 soat hisoblanadi
  const hours = Math.max(1, Math.ceil(diffHours));
  const charge = hours * order.hourlyChargeAmount;

  return { hours, charge };
};

export function PaymentModal({ order, isOpen, onClose, onConfirm, onPartialConfirm }: PaymentModalProps) {
  // Selection mode: 'full' = barchasini to'lash, 'partial' = tanlab to'lash
  const [selectionMode, setSelectionMode] = useState<'full' | 'partial'>('full');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [singlePaymentType, setSinglePaymentType] = useState<PaymentType>('cash');
  const [splitPayment, setSplitPayment] = useState<PaymentSplit>({ cash: 0, card: 0, click: 0 });
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Order o'zgarganda state ni reset qilish
  useEffect(() => {
    if (order) {
      setSplitPayment({ cash: 0, card: 0, click: 0 });
      setComment('');
      setPaymentMode('single');
      setSinglePaymentType('cash');
      setSelectionMode('full');
      setSelectedItemIds(new Set());
    }
  }, [order?._id]);

  // Tanlangan itemlar - useMemo MUST be before early return
  const selectedItems = useMemo(() => {
    if (!order) return [];
    const activeItems = order.items.filter(item => !item.isDeleted && item.status !== 'cancelled');
    const unpaidItems = activeItems.filter(item => !item.isPaid);
    return unpaidItems.filter(item => selectedItemIds.has(item._id));
  }, [order, selectedItemIds]);

  if (!order) return null;

  // Faol itemlar (isDeleted va cancelled bo'lmaganlar)
  const activeItems = order.items.filter(item => !item.isDeleted && item.status !== 'cancelled');

  // To'lanmagan itemlar
  const unpaidItems = activeItems.filter(item => !item.isPaid);

  // To'langan itemlar
  const paidItems = activeItems.filter(item => item.isPaid);

  // Barcha itemlar to'langanmi
  const allItemsPaid = unpaidItems.length === 0;

  // Hisob-kitoblar
  const isSaboy = order.orderType === 'saboy';
  const serviceChargePercent = isSaboy ? 0 : 10;

  // Soatlik to'lov hisoblash
  const hourlyChargeData = calculateHourlyCharge(order);
  const hourlyCharge = hourlyChargeData.charge;

  // Full mode uchun
  const fullSubtotal = unpaidItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fullServiceCharge = isSaboy ? 0 : Math.round(fullSubtotal * (serviceChargePercent / 100));
  const fullTotal = fullSubtotal + fullServiceCharge + hourlyCharge;

  // Partial mode uchun (soatlik to'lov faqat full mode da)
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedServiceCharge = isSaboy ? 0 : Math.round(selectedSubtotal * (serviceChargePercent / 100));
  const selectedTotal = selectedSubtotal + selectedServiceCharge;

  // Hozirgi mode uchun jami
  const currentTotal = selectionMode === 'full' ? fullTotal : selectedTotal;

  // Split payment uchun qolgan summa
  const totalSplit = splitPayment.cash + splitPayment.card + splitPayment.click;
  const remaining = currentTotal - totalSplit;

  const handleSplitChange = (type: keyof PaymentSplit, value: string) => {
    const numValue = parseInt(value.replace(/\D/g, '')) || 0;
    setSplitPayment(prev => ({ ...prev, [type]: numValue }));
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllUnpaid = () => {
    setSelectedItemIds(new Set(unpaidItems.map(item => item._id)));
  };

  const deselectAll = () => {
    setSelectedItemIds(new Set());
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const paymentType = paymentMode === 'split'
        ? (splitPayment.cash >= splitPayment.card && splitPayment.cash >= splitPayment.click ? 'cash' :
           splitPayment.card >= splitPayment.click ? 'card' : 'click')
        : singlePaymentType;

      const split = paymentMode === 'split' ? splitPayment : undefined;

      if (selectionMode === 'partial' && onPartialConfirm) {
        // Partial payment
        const itemIds = Array.from(selectedItemIds);
        await onPartialConfirm(order._id, itemIds, paymentType, split, comment || undefined);
      } else {
        // Full payment
        await onConfirm(order._id, paymentType, split, comment || undefined);
      }
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidPayment =
    (selectionMode === 'full' || selectedItems.length > 0) &&
    (paymentMode === 'single' || (paymentMode === 'split' && Math.abs(remaining) < 100));

  // Agar barcha itemlar to'langan bo'lsa
  if (allItemsPaid) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-[500px]">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <BiCheckCircle className="text-[#22c55e]" />
              Buyurtma to&apos;langan
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground">Bu buyurtmadagi barcha taomlar allaqachon to&apos;langan.</p>
          </div>
          <DialogFooter>
            <Button onClick={onClose} className="w-full">Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <BiMoney className="text-[#22c55e]" />
            To&apos;lov qabul qilish
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Order Info */}
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
            {paidItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm ml-auto">
                <span className="text-[#22c55e]">To&apos;langan: {paidItems.length} ta</span>
              </div>
            )}
          </div>

          {/* Selection Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectionMode('full')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                ${selectionMode === 'full'
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-secondary border border-border text-muted-foreground hover:border-[#404040]'
                }`}
            >
              Barchasini to&apos;lash ({unpaidItems.length} ta)
            </button>
            <button
              onClick={() => setSelectionMode('partial')}
              disabled={!onPartialConfirm}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                ${selectionMode === 'partial'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-secondary border border-border text-muted-foreground hover:border-[#404040]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Tanlab to&apos;lash
            </button>
          </div>

          {/* Items List */}
          <div className="bg-secondary rounded-xl p-3">
            {/* Header with select all */}
            {selectionMode === 'partial' && (
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Taomlarni tanlang:</span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllUnpaid}
                    className="text-xs text-[#3b82f6] hover:underline"
                  >
                    Barchasini tanlash
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Tozalash
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {/* To'lanmagan itemlar */}
              {unpaidItems.map((item) => {
                const isSelected = selectedItemIds.has(item._id);
                return (
                  <div
                    key={item._id}
                    onClick={() => selectionMode === 'partial' && toggleItemSelection(item._id)}
                    className={`flex items-center justify-between py-2 px-2 rounded-lg transition-all
                      ${selectionMode === 'partial' ? 'cursor-pointer hover:bg-background' : ''}
                      ${selectionMode === 'partial' && isSelected ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/30' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {selectionMode === 'partial' && (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                          ${isSelected
                            ? 'bg-[#3b82f6] border-[#3b82f6]'
                            : 'border-muted-foreground'
                          }`}
                        >
                          {isSelected && <BiCheck className="text-white text-sm" />}
                        </div>
                      )}
                      <span className="text-sm">
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                      </span>
                    </div>
                    <span className="text-sm tabular-nums">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}

              {/* To'langan itemlar (faqat ko'rsatish) */}
              {paidItems.length > 0 && (
                <>
                  <div className="border-t border-border my-2 pt-2">
                    <span className="text-xs text-muted-foreground">To&apos;langan taomlar:</span>
                  </div>
                  {paidItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between py-2 px-2 rounded-lg opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-[#22c55e]/20 flex items-center justify-center">
                          <BiCheckCircle className="text-[#22c55e] text-sm" />
                        </div>
                        <span className="text-sm line-through">
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground tabular-nums line-through">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-secondary rounded-xl p-3">
            {selectionMode === 'partial' && (
              <div className="flex justify-between text-sm mb-2 pb-2 border-b border-border">
                <span className="text-muted-foreground">Tanlangan: {selectedItems.length} ta</span>
                <span className="tabular-nums">{formatMoney(selectedSubtotal)}</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Taomlar:</span>
                    <span className="tabular-nums">{formatMoney(selectionMode === 'full' ? fullSubtotal : selectedSubtotal)}</span>
                  </div>
                  {!isSaboy && (selectionMode === 'full' ? fullServiceCharge : selectedServiceCharge) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#3b82f6] border-l border-border pl-4">
                      <span>Xizmat (10%):</span>
                      <span className="tabular-nums">{formatMoney(selectionMode === 'full' ? fullServiceCharge : selectedServiceCharge)}</span>
                    </div>
                  )}
                  {/* Soatlik to'lov - faqat full mode da */}
                  {selectionMode === 'full' && hourlyCharge > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#a855f7] border-l border-border pl-4">
                      <BiTime className="text-base" />
                      <span>Bandlik ({hourlyChargeData.hours} soat):</span>
                      <span className="tabular-nums">{formatMoney(hourlyCharge)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <span className="font-medium text-sm">Jami:</span>
                <span className="text-xl font-bold text-[#22c55e] tabular-nums">
                  {formatMoney(currentTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Mode Toggle */}
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

            {/* Single Payment Type Selection */}
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

          {/* Split Payment Inputs */}
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
            className={`flex-1 text-white disabled:opacity-50
              ${selectionMode === 'partial' ? 'bg-[#3b82f6] hover:bg-[#3b82f6]/90' : 'bg-[#22c55e] hover:bg-[#22c55e]/90'}
            `}
          >
            <BiCheck className="mr-2" />
            {isLoading ? 'Kutilmoqda...' : (
              selectionMode === 'partial'
                ? `Tanlanganlarni to'lash (${selectedItems.length})`
                : 'To\'lovni tasdiqlash'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
