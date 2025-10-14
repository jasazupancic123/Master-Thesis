import toast from 'react-hot-toast';

import type { ExerciseSetTracking } from '@/common/type/exercise-set-tracking-state.type';
import type { SetState } from '@/common/type/state.type';
import { KeypointHistory } from '@/controller/pose-detection/class/keypoint-history';
import type { Rep } from '@/controller/pose-detection/type/rep.type';
import { TrainingService } from '@/controller/training/training.service';
import type { CompleteSet } from '@/controller/training/type/complete-set.type';
import type { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';

export const finishSet = async (state: {
  exercise: TrainingExerciseRecording;
  setIndex: number;
  trainingInProgress: TrainingInProgress;
  setTrainingInProgress: SetState<TrainingInProgress | null>;
  handleUpsertSet: (
    body: Omit<CompleteSet, 'userId'>,
    state: { exerciseId: string; supersetIndex: number; setIndex: number }
  ) => Promise<void>;
}) => {
  const {
    exercise,
    setIndex,
    trainingInProgress,
    setTrainingInProgress,
    handleUpsertSet,
  } = state;

  const exerciseSet = exercise.sets[setIndex];

  const set = TrainingService.exerciseSetToCompleteSet(exerciseSet);

  if (exercise.recordedSets && exercise.recordedSets.length) {
    const currentSet = exercise.recordedSets.find(
      (s) => s.setIndex === setIndex
    );

    const allImages = [currentSet?.imagesL, currentSet?.imagesR].flatMap(
      (imgs) => imgs || []
    );

    if (currentSet && allImages.length) {
      const lastRepImage = allImages[allImages.length - 1];
      set.photoUrl = lastRepImage.url;
    }
  }

  markExerciseSetAsCompleted(
    { exerciseId: exercise.id },
    setIndex + 1,
    trainingInProgress.exerciseSetTrackingState,
    setTrainingInProgress
  );

  const supersetIndex =
    trainingInProgress.selectedComponent.supersets.findIndex((superset) =>
      superset.exercises.find((ex) => ex.id === exercise.id)
    );

  if (supersetIndex === -1) {
    toast.error('Superset not found');
    return;
  }

  await handleUpsertSet(set, {
    exerciseId: exercise.id,
    setIndex,
    supersetIndex,
  });
};

export const isExerciseSetCompleted = (
  exerciseIdentifier: { exerciseId: string },
  setNumber: number,
  exerciseSetTrackingState: ExerciseSetTracking[]
) => {
  for (const key of Array.from(exerciseSetTrackingState)) {
    if (key.exerciseId === exerciseIdentifier.exerciseId)
      return key.completedSetNumbers.includes(setNumber);
  }
  return false;
};

export const markExerciseSetAsCompleted = (
  exerciseIdentifier: { exerciseId: string },
  setNumber: number,
  exerciseSetTrackingState: ExerciseSetTracking[],
  setTrainingInProgress: SetState<TrainingInProgress | null>
) => {
  const key = Array.from(exerciseSetTrackingState).find(
    (k) => k.exerciseId === exerciseIdentifier.exerciseId
  );

  if (key) {
    const completedSets = key.completedSetNumbers || [];
    if (!completedSets.includes(setNumber)) {
      completedSets.push(setNumber);
      key.completedSetNumbers = completedSets;
    }
  } else
    exerciseSetTrackingState.push({
      ...exerciseIdentifier,
      completedSetNumbers: [setNumber],
    });

  setTrainingInProgress((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      exerciseSetTrackingState,
    } as TrainingInProgress;
  });
};

export const unmarkExerciseSetAsCompleted = (
  exerciseIdentifier: { exerciseId: string },
  setNumber: number,
  exerciseSetTrackingState: ExerciseSetTracking[],
  setTrainingInProgress: SetState<TrainingInProgress | null>
) => {
  const key = Array.from(exerciseSetTrackingState).find(
    (k) => k.exerciseId === exerciseIdentifier.exerciseId
  );
  if (!key) return;

  const completedSets = key.completedSetNumbers || [];
  const index = completedSets.indexOf(setNumber);
  if (index > -1) {
    completedSets.splice(index, 1);
    key.completedSetNumbers = completedSets;
  }

  setTrainingInProgress((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      exerciseSetTrackingState,
    } as TrainingInProgress;
  });
};

export const demoReps = [
  {
    repNumber: 1,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 200,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 700,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 2,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 1000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 3,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 1000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 4,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 4000,
    timeAtExtremeMs: 1500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 5,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 200,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 700,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 6,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 1000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 7,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 1000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 8,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 4000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 9,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 200,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 700,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 10,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 1000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 11,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 1000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
  {
    repNumber: 12,
    startValue: 1,
    startValueFrameNum: 1,
    startTimestamp: new Date(),
    buffer: new KeypointHistory([]),
    detectedExtremum: true,
    currentlyInExtremumRange: false,
    idleTimeMs: 1000,
    timeToExtremeMs: 4000,
    timeAtExtremeMs: 500,
    timeFromExtremeToEndMs: 1000,
    durationMs: 2500,
    endValueTimestamp: new Date(),
  } as Rep,
];
