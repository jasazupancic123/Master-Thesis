import React from 'react';
import { Box } from '@mui/material';
import MyModal from '@/components/modal';

interface Props {
  data: any;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function CalendarDayModal(props: Props) {
  const { data, isOpen, setIsOpen } = props;

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} width={500}>
      <Box>test123</Box>
    </MyModal>
  );
}
