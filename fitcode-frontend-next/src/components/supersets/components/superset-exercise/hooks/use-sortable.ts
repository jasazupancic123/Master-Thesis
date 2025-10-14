import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useSupersets } from '@/store/supersets.provider';

export default function useSupersetExerciseSortable(
  exercise: TrainingExercise
) {
  const { selectedExercise } = useSupersets();

  const disabledDrag = !!(selectedExercise?.id === exercise.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    disabled: disabledDrag,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    borderRadius: 4,
    boxShadow: isDragging && !open ? '0 2px 8px rgba(0,0,0,0.2)' : undefined,
    background: isDragging ? '#f0f0f0' : 'transparent',
    zIndex: isDragging ? 1000 : 'auto',
    // Hide the original while dragging so the overlay represents the item
    opacity: isDragging ? 0 : 1,
    touchAction: 'none' /* critical for mobile dragging */,
    userSelect: 'none',
    willChange: 'transform',
  };

  return {
    attributes,
    listeners,
    setNodeRef,
    disabledDrag,
    style,
  };
}
