import React, { ReactNode } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, SxProps } from '@mui/material';
import Button from '@mui/material/Button';

export interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  width?: number;
  sx?: SxProps;
}

export default function MyModal(props: Props) {
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