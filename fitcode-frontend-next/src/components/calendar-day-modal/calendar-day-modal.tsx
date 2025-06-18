import MyModal from '@/components/modal/modal';
import { Box } from '@mui/material';
import React from 'react';

export interface CalendarDayModalProps {
  data: any;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function CalendarDayModal(props: CalendarDayModalProps) {
  const { isOpen, setIsOpen } = props;

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} width={500}>
      <Box>Calendar Day Modal</Box>
    </MyModal>
  );
}
