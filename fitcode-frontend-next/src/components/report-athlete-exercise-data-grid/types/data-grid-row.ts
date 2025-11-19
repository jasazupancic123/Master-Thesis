export type DataGridRowAthleteExercise = {
  exerciseId: string;
  exerciseName: string;
  cyclesAvgReps: number | undefined; // per training, not per set
  cyclesAvgTonnage: number | undefined; // per training, not per set
  selectedTrainingReps?: number | undefined; // per training, not per set
  selectedTrainingTonnage?: number | undefined; // per training, not per set
};
