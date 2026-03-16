import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import * as React from 'react';
import { useUpgradeModal } from '../contexts/upgrade-modal-context';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';

export function UpgradeModal() {
  const { isOpen, isPro, closeModal } = useUpgradeModal();

  if (isPro) return null;

  const features = ['Access to all premium tools', 'Advanced features', 'Priority support'];

  const handleGetPro = () => {
    window.electron.openExternal('https://devkithub.com/pricing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Crown className="w-10 h-10 text-amber-950" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center border-2 border-slate-800">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Upgrade to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                Pro
              </span>
            </h2>
            <p className="text-slate-400 mb-6">
              Unlock all premium features and take your workflow to the next level
            </p>

            <ul className="space-y-3 mb-8 text-left">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              onClick={handleGetPro}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-semibold text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 mr-2" />
              Get Pro Now
            </Button>

            <p className="text-xs text-slate-500 mt-4">30-day money-back guarantee</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
