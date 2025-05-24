import { Trash2 } from 'lucide-react';
import React from 'react';
import { ConfirmationDialog as ConfirmationDialogType } from '../../../types/profile';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';

interface ConfirmationDialogProps {
  dialog: ConfirmationDialogType;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmationDialog({ dialog, onOpenChange, onConfirm }: ConfirmationDialogProps) {
  return (
    <Dialog open={dialog.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete Theme
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{dialog.themeName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
