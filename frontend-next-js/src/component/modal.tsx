import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';

export interface MyModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  title?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  width?: number;
  sx?: any;
}

export default function MyModal(props: MyModalProps) {
  const {
    isOpen,
    setIsOpen,
    title,
    actions,
    children,
    onCancel,
    onConfirm,
    width,
    sx,
  } = props;

  function handleClose() {
    setIsOpen(false);
    if (onCancel) onCancel();
  }

  return (
    <>
      {isOpen && <Dialog
        open={isOpen}
        onClose={handleClose}
        scroll="paper"
        sx={sx}
      >
        {title && <DialogTitle>{title}</DialogTitle>}
        <DialogContent dividers sx={{ width, bgcolor: 'background.default' }}>
          {children}

          {actions}

          {(onConfirm || onCancel) && <DialogActions>
            {onConfirm && <Button onClick={onConfirm} color="primary">Confirm</Button>}
            {onCancel && <Button onClick={handleClose} color="secondary">Cancel</Button>}
          </DialogActions>}
        </DialogContent>
      </Dialog>}
    </>
  );
}