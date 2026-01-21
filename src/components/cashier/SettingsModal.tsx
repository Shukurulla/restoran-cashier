'use client';

import { useState, useEffect } from 'react';
import { PrinterInfo } from '@/types';
import { PrinterAPI } from '@/services/printer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BiCog, BiPrinter, BiServer, BiRefresh } from 'react-icons/bi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [serverUrl, setServerUrl] = useState('https://kepket.kerek.uz');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrinters();
      const savedPrinter = localStorage.getItem('selectedPrinter');
      const savedUrl = localStorage.getItem('serverUrl');
      if (savedPrinter) setSelectedPrinter(savedPrinter);
      if (savedUrl) setServerUrl(savedUrl);
    }
  }, [isOpen]);

  const loadPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const printerList = await PrinterAPI.getPrinters();
      setPrinters(printerList);
      if (printerList.length > 0 && !selectedPrinter) {
        const defaultPrinter = printerList.find(p => p.isDefault);
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        }
      }
    } catch (error) {
      console.error('Failed to load printers:', error);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleTestPrint = async () => {
    setIsPrinting(true);
    try {
      const result = await PrinterAPI.printTest(selectedPrinter || undefined);
      if (!result.success) {
        alert('Test chop etish xatoligi: ' + result.error);
      }
    } catch (error) {
      alert('Printer server bilan bog\'lanib bo\'lmadi');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('selectedPrinter', selectedPrinter);
    localStorage.setItem('serverUrl', serverUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <BiCog className="text-[#3b82f6]" />
            Sozlamalar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Printer Settings */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold">
              <BiPrinter className="text-[#3b82f6]" />
              Printer sozlamalari
            </h3>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Printer tanlang</label>
              <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="-- Printer tanlang --" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {printers.map((printer) => (
                    <SelectItem key={printer.name} value={printer.name}>
                      {printer.displayName} {printer.isDefault && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={loadPrinters}
                disabled={isLoadingPrinters}
                className="flex-1"
              >
                <BiRefresh className={`mr-2 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
                Yangilash
              </Button>
              <Button
                onClick={handleTestPrint}
                disabled={isPrinting || !selectedPrinter}
                className="flex-1 bg-primary text-primary-foreground"
              >
                <BiPrinter className="mr-2" />
                {isPrinting ? 'Chop etilmoqda...' : 'Test chop etish'}
              </Button>
            </div>
          </div>

          {/* Server Settings */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold">
              <BiServer className="text-[#3b82f6]" />
              Server sozlamalari
            </h3>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Server URL</label>
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Bekor qilish
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white">
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
