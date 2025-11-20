export type DataGridRowAthleteExerciseRow = {
  exerciseId: string;
  exerciseName: string;
  selectedTrainingReps?: number | undefined; // per training, not per set
  selectedTrainingTonnage?: number | undefined; // per training, not per set
  prescribedTrainingReps?: number | undefined; // per training, not per set
  prescribedTrainingTonnage?: number | undefined; // per training, not per set
};
