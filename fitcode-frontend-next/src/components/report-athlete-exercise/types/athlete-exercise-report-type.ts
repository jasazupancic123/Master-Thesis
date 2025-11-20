export type AthleteExerciseReportType = {
  id: string;
  userId: string | undefined;
  userIds: string[];
  exerciseId: string | undefined;
  type: 'single' | 'comparison';
};
