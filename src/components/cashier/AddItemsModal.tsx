'use client';

import { useState, useEffect, useMemo } from 'react';
import { Order } from '@/types';
import { api } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BiPlus, BiMinus, BiSearch, BiX, BiCategory } from 'react-icons/bi';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  categoryName?: string;
}

interface Category {
  _id: string;
  title: string;
}

interface SelectedItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
}

interface AddItemsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
};

export function AddItemsModal({ order, isOpen, onClose, onSuccess }: AddItemsModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menu va kategoriyalarni yuklash
  useEffect(() => {
    if (isOpen) {
      loadMenuData();
    }
  }, [isOpen]);

  // Modal yopilganda state ni tozalash
  useEffect(() => {
    if (!isOpen) {
      setSelectedItems([]);
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  const loadMenuData = async () => {
    setIsLoading(true);
    try {
      const [menuData, categoriesData] = await Promise.all([
        api.getMenuItems(),
        api.getCategories(),
      ]);
      setMenuItems(menuData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Menu yuklashda xatolik:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filterlangan taomlar
  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Kategoriya bo'yicha filter
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Qidiruv bo'yicha filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  // Item tanlash/miqdorini o'zgartirish
  const updateItemQuantity = (item: MenuItem, delta: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.foodId === item._id);

      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter(i => i.foodId !== item._id);
        }
        return prev.map(i =>
          i.foodId === item._id ? { ...i, quantity: newQuantity } : i
        );
      } else if (delta > 0) {
        return [...prev, {
          foodId: item._id,
          name: item.name,
          price: item.price,
          quantity: delta,
        }];
      }
      return prev;
    });
  };

  // Tanlangan item miqdorini olish
  const getSelectedQuantity = (itemId: string) => {
    return selectedItems.find(i => i.foodId === itemId)?.quantity || 0;
  };

  // Jami summa
  const totalAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  // Qo'shish
  const handleSubmit = async () => {
    if (!order || selectedItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const updatedOrder = await api.addItemsToOrder(order._id, selectedItems);
      onSuccess(updatedOrder);
      onClose();
    } catch (error) {
      console.error('Item qo\'shishda xatolik:', error);
      alert(error instanceof Error ? error.message : 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <BiPlus className="text-[#3b82f6]" />
            Taom qo&apos;shish - {order.tableName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Qidiruv va Kategoriyalar */}
          <div className="flex gap-3 flex-shrink-0">
            {/* Qidiruv */}
            <div className="relative flex-1">
              <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Taom qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-[#3b82f6]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <BiX />
                </button>
              )}
            </div>
          </div>

          {/* Kategoriyalar */}
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                ${selectedCategory === 'all'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-secondary text-muted-foreground hover:bg-[#262626]'}`}
            >
              <BiCategory />
              Hammasi
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${selectedCategory === cat._id
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-[#262626]'}`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Taomlar ro'yxati */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Yuklanmoqda...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Taom topilmadi
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map(item => {
                  const quantity = getSelectedQuantity(item._id);
                  const isSelected = quantity > 0;

                  return (
                    <div
                      key={item._id}
                      className={`p-3 rounded-xl border transition-all
                        ${isSelected
                          ? 'bg-[#3b82f6]/10 border-[#3b82f6]'
                          : 'bg-secondary border-border hover:border-[#404040]'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-[#22c55e] text-sm font-semibold mt-0.5">
                            {formatMoney(item.price)}
                          </p>
                        </div>
                      </div>

                      {/* Miqdor tugmalari */}
                      <div className="flex items-center justify-between mt-3">
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateItemQuantity(item, -1)}
                              className="w-8 h-8 rounded-lg bg-[#262626] hover:bg-[#303030] flex items-center justify-center text-lg"
                            >
                              <BiMinus />
                            </button>
                            <span className="w-8 text-center font-semibold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateItemQuantity(item, 1)}
                              className="w-8 h-8 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-white flex items-center justify-center text-lg"
                            >
                              <BiPlus />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateItemQuantity(item, 1)}
                            className="w-full py-2 rounded-lg bg-[#262626] hover:bg-[#303030] text-sm font-medium flex items-center justify-center gap-1.5"
                          >
                            <BiPlus />
                            Qo&apos;shish
                          </button>
                        )}
                        {isSelected && (
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {formatMoney(item.price * quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tanlangan taomlar summasi */}
          {selectedItems.length > 0 && (
            <div className="flex-shrink-0 bg-secondary rounded-xl p-4 border border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-muted-foreground">Tanlangan taomlar:</span>
                <span className="font-medium">{selectedItems.length} ta</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 max-h-20 overflow-y-auto">
                {selectedItems.map(item => (
                  <div
                    key={item.foodId}
                    className="flex items-center gap-2 bg-[#262626] px-2 py-1 rounded-lg text-sm"
                  >
                    <span>{item.name}</span>
                    <span className="text-[#3b82f6] font-medium">x{item.quantity}</span>
                    <button
                      onClick={() => setSelectedItems(prev => prev.filter(i => i.foodId !== item.foodId))}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <BiX />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-semibold">Jami:</span>
                <span className="text-lg font-bold text-[#22c55e]">{formatMoney(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || isSubmitting}
            className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
          >
            {isSubmitting ? 'Qo\'shilmoqda...' : `${selectedItems.length} ta taom qo'shish`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
