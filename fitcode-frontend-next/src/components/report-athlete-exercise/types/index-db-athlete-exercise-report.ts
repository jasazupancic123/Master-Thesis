export type IndexDbAthleteExerciseReport = {
  id: string;
  institutionId: string;
  userId?: string;
  userIds?: string[];
  exerciseId?: string;
  type: 'single' | 'comparison';
};
