export type ExerciseSetTracking = {
  exerciseId: string;
  completedSetNumbers: {
    setNumber: number;
    timestamp: Date;
    isBeenSetToCompleted?: boolean;
  }[];
};
