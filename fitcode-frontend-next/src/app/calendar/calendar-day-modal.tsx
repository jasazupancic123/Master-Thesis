import React, { useRef, useEffect } from 'react';
import { Training } from '@/training/entity/training.entity';
import MyModal from '@/common/components/modal';
import { Box } from '@mui/material';

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
