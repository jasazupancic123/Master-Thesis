import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  SxProps,
} from '@mui/material';
import Button from '@mui/material/Button';
import React, { ReactNode } from 'react';

export interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onDelete?: () => void;
  cancelText?: string;
  width?: number | string;
  sx?: SxProps;
  dialogueContentSx?: SxProps;
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
    onDelete,
    width,
    sx,
    cancelText = 'Cancel',
    dialogueContentSx,
  } = props;

  function handleClose() {
    setIsOpen(false);
    if (onCancel) onCancel();
  }

  function handleDelete() {
    setIsOpen(false);
    if (onDelete) onDelete();
  }

  return (
    <>
      {isOpen && (
        <Dialog open={isOpen} onClose={handleClose} scroll="paper" sx={sx}>
          {title && <DialogTitle>{title}</DialogTitle>}
          <DialogContent
            dividers
            sx={{ ...dialogueContentSx, width, bgcolor: 'background.default' }}
          >
            {children}

            {actions}

            {(onConfirm || onCancel) && (
              <DialogActions>
                {onConfirm && (
                  <Button onClick={onConfirm} color="primary">
                    Confirm
                  </Button>
                )}
                {onCancel && (
                  <Button onClick={handleClose} color="secondary">
                    {cancelText}
                  </Button>
                )}
                {onDelete && (
                  <Button onClick={handleDelete} color="secondary">
                    Delete
                  </Button>
                )}
              </DialogActions>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
