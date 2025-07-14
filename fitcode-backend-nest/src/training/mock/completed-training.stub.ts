import { CompletedTrainingExercise } from '../entity/completed-training.entity';

export function generateCompletedTrainingExerciseStub(
  data?: Partial<CompletedTrainingExercise>,
): CompletedTrainingExercise {
  return {
    id: data?.id,
    supersetIndex: data?.supersetIndex || 0,
    sets: data?.sets || [],
  };
}
