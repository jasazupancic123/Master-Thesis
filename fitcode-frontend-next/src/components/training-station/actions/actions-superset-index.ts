import { Training } from '@/core/training/type/training.type';

/**
 * 
 * @param training - Individual training of the selectedUser
 * @returns The superset index of the exercise in the component, or null if not found
 */
export const getSupersetIndex = (
  training: Training,
  componentId: string,
  exerciseId: string
): number | null => {
  const component = training.components.find((c) => c.id === componentId);
  if (!component) return null;

  for (let i = 0; i < component.supersets.length; i++) {
    const superset = component.supersets[i];
    const exercise = superset.exercises.find((e) => e.id === exerciseId);
    if (exercise) return i;
  }

  return null;
};
