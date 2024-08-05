import React from 'react';
import { Divider, Modal } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface MyModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  title?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  width?: number;
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

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
  } = props;

  function handleClose() {
    setIsOpen(false);
    if (onCancel) onCancel();
  }

  return (
    <>
      {isOpen && <Modal
        open={isOpen}
        onClose={handleClose}
      >
        <Box sx={{ ...style, width }}>
          {title && <Typography variant="h6">
            {title}
          </Typography>}

          {children}

          <Divider sx={{ mt: 2, mb: 2 }} />
          {actions}

          <Box>
            {onConfirm && <Button onClick={onConfirm} color="primary">Confirm</Button>}
            {onCancel && <Button onClick={handleClose} color="secondary">Cancel</Button>}
          </Box>
        </Box>
      </Modal>}
    </>
  );
}