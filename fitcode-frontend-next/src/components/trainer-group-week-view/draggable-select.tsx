import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';

import type { EventType } from '@/controller/group/enum/event-type.enum';

export default function DraggableSelect({
  selectedEventType,
  children,
}: {
  selectedEventType: EventType | null;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: 'add-event', // static id is fine since there's only one draggable
      disabled: !selectedEventType,
      data: { eventType: selectedEventType },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        cursor: isDragging ? 'grabbing' : undefined,
      }
    : { cursor: selectedEventType ? 'grab' : undefined };

  return (
    <Box ref={setNodeRef} {...attributes} {...listeners} sx={style}>
      {children}
    </Box>
  );
}
