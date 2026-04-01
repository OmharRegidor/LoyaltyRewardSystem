'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Crown,
  ShoppingCart,
  Users,
  BarChart3,
  Sparkles,
  Stamp,
} from 'lucide-react';

interface UpgradeCongratsModalProps {
  open: boolean;
  onDismiss: () => void;
}

export function UpgradeCongratsModal({ open, onDismiss }: UpgradeCongratsModalProps) {
  const handleDismiss = async () => {
    try {
      await fetch('/api/billing/acknowledge-upgrade', { method: 'POST' });
    } catch {
      // Non-critical, proceed anyway
    }
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-yellow-500 flex items-center justify-center mx-auto mb-2">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl">
            Welcome to Enterprise!
          </DialogTitle>
          <DialogDescription>
            Your account has been upgraded. Enjoy all premium features!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {[
            { icon: Stamp, label: 'Digital Stamp Card', desc: 'Simple punch card loyalty for your customers' },
            { icon: ShoppingCart, label: 'Point-of-Sale System', desc: 'Process sales and manage inventory' },
            { icon: Users, label: 'Unlimited Staff', desc: 'Add as many team members as you need' },
            { icon: BarChart3, label: 'Advanced Analytics', desc: 'Deep insights into your business' },
            { icon: Sparkles, label: 'Custom Branding', desc: 'Personalize the customer experience' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-yellow-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-secondary to-yellow-500 hover:from-secondary/90 hover:to-yellow-500/90 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
          >
            Get Started
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
