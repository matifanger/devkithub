import { CheckCircle, XCircle } from 'lucide-react';
import React from 'react';
import { NotificationDialog as NotificationDialogType } from '../../../types/profile';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';

interface NotificationDialogProps {
  dialog: NotificationDialogType;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDialog({ dialog, onOpenChange }: NotificationDialogProps) {
  return (
    <Dialog open={dialog.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialog.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {dialog.title}
          </DialogTitle>
          <DialogDescription>{dialog.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
