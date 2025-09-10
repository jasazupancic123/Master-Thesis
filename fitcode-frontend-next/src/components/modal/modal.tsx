import type { SxProps } from '@mui/material';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import Button from '@mui/material/Button';
import type { ReactNode } from 'react';
import React from 'react';

import { useScreenSize } from '@/store/screen-size.provider';

export interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onDelete?: () => void;
  confirmText?: string;
  cancelText?: string;
  width?: number | string;
  sx?: SxProps;
  dialogueContentSx?: SxProps;
  componentCalendarView?: boolean;
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
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    dialogueContentSx,
    componentCalendarView,
  } = props;

  const screenSize = useScreenSize();

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
        <Dialog
          open={isOpen}
          onClose={handleClose}
          scroll={componentCalendarView ? 'body' : 'paper'}
          maxWidth={componentCalendarView ? false : undefined}
          sx={sx}
        >
          {title && <DialogTitle>{title}</DialogTitle>}
          <DialogContent
            dividers
            sx={{
              ...dialogueContentSx,
              width,
              bgcolor: 'background.default',
              p: screenSize.isMobile ? 0.5 : undefined,
            }}
          >
            {children}

            {actions}

            {(onConfirm || onCancel) && (
              <DialogActions>
                {onConfirm && (
                  <Button onClick={onConfirm} color="primary">
                    {confirmText}
                  </Button>
                )}
                {onDelete && (
                  <Button onClick={handleDelete} color="secondary">
                    Delete
                  </Button>
                )}
                {onCancel && (
                  <Button onClick={handleClose} color="secondary">
                    {cancelText}
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
