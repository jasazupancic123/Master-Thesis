import MyModal from '@/components/modal';
import { Box } from '@mui/material';
import React from 'react';
import { CalendarDayModalProps } from './type';

export default function CalendarDayModal(props: CalendarDayModalProps) {
  const { data, isOpen, setIsOpen } = props;

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} width={500}>
      <Box>test123</Box>
    </MyModal>
  );
}
