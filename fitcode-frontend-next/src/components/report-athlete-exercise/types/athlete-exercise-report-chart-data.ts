export type AthleteExerciseReportChartData = {
  index: number;
  userId: string;
  workloadId: string;
  trainingId: string;
  date: Date;
  load: number;
  reps: number;
  loadR?: number;
  repsR?: number;
};
