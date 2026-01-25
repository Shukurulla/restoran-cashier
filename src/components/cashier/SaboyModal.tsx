'use client';

import { useState, useEffect } from 'react';
import { PaymentType, PaymentSplit, SaboyItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BiPackage, BiMoney, BiCreditCard, BiPlus, BiMinus, BiCheck, BiX, BiSearch } from 'react-icons/bi';
import { SiKlarna } from 'react-icons/si';
import { api } from '@/services/api';

interface SaboyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
}

interface Category {
  _id: string;
  title: string;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

export function SaboyModal({ isOpen, onClose, onSuccess }: SaboyModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<SaboyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Modal ochilganda menu va kategoriyalarni yuklash
  useEffect(() => {
    if (isOpen) {
      loadMenuData();
      // Reset state
      setSelectedItems([]);
      setPaymentType('cash');
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  const loadMenuData = async () => {
    setIsLoadingMenu(true);
    try {
      const [items, cats] = await Promise.all([
        api.getMenuItems(),
        api.getCategories(),
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error('Menu yuklashda xatolik:', error);
      alert('Menu yuklashda xatolik');
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Taom qo'shish/o'chirish
  const addItem = (item: MenuItem | SaboyItem) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 'quantity' in item ? item.quantity : 1, category: item.category }];
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i._id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i._id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    return selectedItems.find(i => i._id === itemId)?.quantity || 0;
  };

  // Jami summa
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filterlangan taomlar
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Saboy order yaratish
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert('Mahsulot tanlanmagan');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.createSaboyOrder(selectedItems, paymentType);
      alert(`Saboy #${result.saboyNumber} yaratildi - ${formatMoney(result.grandTotal)}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Saboy yaratishda xatolik:', error);
      alert('Saboy yaratishda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border !max-w-[1600px] w-[95vw] h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <BiPackage className="text-[#f97316] text-2xl" />
            Saboy (Olib ketish)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
          {/* Chap tomon - Menu */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-[500px]">
            {/* Qidiruv */}
            <div className="relative mb-4">
              <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg" />
              <input
                type="text"
                placeholder="Taom qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-12 pr-4 text-base focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            {/* Kategoriyalar */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all
                  ${selectedCategory === 'all'
                    ? 'bg-[#f97316] text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-[#262626]'
                  }`}
              >
                Barchasi
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all
                    ${selectedCategory === cat._id
                      ? 'bg-[#f97316] text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-[#262626]'
                    }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            {/* Taomlar */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {isLoadingMenu ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f97316]"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {menuItems.length === 0 ? 'Menyu yuklanmadi' : 'Taom topilmadi'}
                </div>
              ) : (
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredItems.map(item => {
                    const qty = getItemQuantity(item._id);
                    return (
                      <div
                        key={item._id}
                        className={`bg-secondary rounded-lg p-4 flex flex-col transition-all cursor-pointer
                          ${qty > 0 ? 'ring-2 ring-[#f97316]' : 'hover:bg-[#262626]'}`}
                        onClick={() => addItem(item)}
                      >
                        <span className="text-sm font-medium truncate">{item.name}</span>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">{formatMoney(item.price)}</span>
                          {qty > 0 && (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => removeItem(item._id)}
                                className="w-7 h-7 bg-[#ef4444] rounded flex items-center justify-center text-white"
                              >
                                <BiMinus className="text-sm" />
                              </button>
                              <span className="text-sm font-semibold w-6 text-center">{qty}</span>
                              <button
                                onClick={() => addItem(item)}
                                className="w-7 h-7 bg-[#22c55e] rounded flex items-center justify-center text-white"
                              >
                                <BiPlus className="text-sm" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* O'ng tomon - Tanlangan taomlar */}
          <div className="w-[450px] flex flex-col bg-secondary rounded-xl p-5">
            <h3 className="font-semibold text-base mb-4">Tanlangan taomlar</h3>

            {/* Tanlangan taomlar ro'yxati */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {selectedItems.length === 0 ? (
                <div className="text-center text-muted-foreground text-base py-12">
                  Taom tanlanmagan
                </div>
              ) : (
                selectedItems.map(item => (
                  <div key={item._id} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-base truncate block">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{formatMoney(item.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeItem(item._id)}
                        className="w-8 h-8 bg-[#ef4444] rounded-lg flex items-center justify-center text-white"
                      >
                        <BiMinus className="text-base" />
                      </button>
                      <span className="text-base font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => addItem(item)}
                        className="w-8 h-8 bg-[#22c55e] rounded-lg flex items-center justify-center text-white"
                      >
                        <BiPlus className="text-base" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* To'lov turi */}
            <div className="mb-5">
              <span className="text-sm text-muted-foreground block mb-3">To&apos;lov turi:</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentType('cash')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all
                    ${paymentType === 'cash'
                      ? 'border-[#22c55e] text-[#22c55e] bg-[#22c55e]/5'
                      : 'border-border text-muted-foreground hover:border-[#404040]'
                    }`}
                >
                  <BiMoney className="text-xl" />
                  <span className="text-sm">Naqd</span>
                </button>
                <button
                  onClick={() => setPaymentType('card')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all
                    ${paymentType === 'card'
                      ? 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5'
                      : 'border-border text-muted-foreground hover:border-[#404040]'
                    }`}
                >
                  <BiCreditCard className="text-xl" />
                  <span className="text-sm">Karta</span>
                </button>
                <button
                  onClick={() => setPaymentType('click')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all
                    ${paymentType === 'click'
                      ? 'border-[#a855f7] text-[#a855f7] bg-[#a855f7]/5'
                      : 'border-border text-muted-foreground hover:border-[#404040]'
                    }`}
                >
                  <SiKlarna className="text-xl" />
                  <span className="text-sm">Click</span>
                </button>
              </div>
            </div>

            {/* Jami */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-base text-muted-foreground">Jami:</span>
                <span className="text-2xl font-bold text-[#f97316]">{formatMoney(total)}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Xizmat haqi yo&apos;q (Saboy)
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-4 pt-5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          >
            <BiX className="mr-2 text-lg" />
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedItems.length === 0}
            className="flex-1 h-12 text-base bg-[#f97316] hover:bg-[#f97316]/90 text-white"
          >
            <BiCheck className="mr-2 text-lg" />
            {isLoading ? 'Kutilmoqda...' : `To'lovni tasdiqlash`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
