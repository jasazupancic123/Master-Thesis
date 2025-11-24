export type IndexDbAthleteExerciseReport = {
  id: string;
  groupId: string;
  userId?: string;
  userIds?: string[];
  exerciseId?: string;
  type: 'single' | 'comparison';
};
