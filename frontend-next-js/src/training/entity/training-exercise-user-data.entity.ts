export type TrainingExerciseUserData = {
  userId: string;
  workloadValue: string | number;
  completedSets: number;
  completedSetTypeValue?: number; // reps / distance / time / ...
  completedWorkloadValue?: string | number; // kg / % bw / ...
}