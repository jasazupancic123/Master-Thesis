import { useDroppable } from '@dnd-kit/core';
import { Box } from '@mui/material';

export default function DroppableSlot({
  id,
  dayIndex,
  period, // 'AM' | 'PM'
  children,
}: {
  id: string;
  dayIndex: number;
  period: 'AM' | 'PM';
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { dayIndex, period },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{ backgroundColor: isOver ? 'action.hover' : undefined }}
    >
      {children}
    </Box>
  );
}
