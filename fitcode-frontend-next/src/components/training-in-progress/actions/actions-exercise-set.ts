import toast from 'react-hot-toast';

import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';
import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { CreateWorkload } from '@/core/training/type/workload.type';
import type { SetState } from '@/lib/common/type/state.type';
import { KeypointHistory } from '@/lib/pose-detection/class/keypoint-history';
import type { Rep } from '@/lib/pose-detection/type/rep.type';

export const finishSet = async (state: {
  exercise: TrainingExerciseRecording;
  setIndex: number;
  trainingInProgress: TrainingInProgress;
  setTrainingInProgress: SetState<TrainingInProgress | null>;
  handleUpsertSet: (
    body: CreateWorkload,
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

  const set = exercise.sets[setIndex];
  const workload: CreateWorkload = {
    userId: trainingInProgress.userId,
    timestamp: new Date(),
    notes: '',
    reps: set.reps,
    repsR: set.repsR,
    loadKg: set.loadKg,
    loadKgR: set.loadKgR,
    tempo: set.tempo,
    tempoR: set.tempoR,
    vel: set.vel,
    velR: set.velR,
    recTime: set.recTime,
    recDist: set.recDist,
    eff: set.eff,
    time: set.time,
    dist: set.dist,
    photoURLs: [],
    rir: undefined,
    rirR: undefined,
    rom: undefined,
    romR: undefined,
    tempos: undefined,
    temposR: undefined,
    roms: undefined,
    romsR: undefined,
    velocities: undefined,
    velocitiesR: undefined,
    feedback: undefined,
    feedbackR: undefined,
  };

  if (exercise.recordedSets && exercise.recordedSets.length) {
    const currentSet = exercise.recordedSets.find(
      (s) => s.setIndex === setIndex
    );

    if (currentSet) {
      if (currentSet.imagesL)
        workload.photoURLs!.push(...currentSet.imagesL.map((img) => img.url));

      if (currentSet.imagesR)
        workload.photoURLs!.push(...currentSet.imagesR.map((img) => img.url));
    }
  }

  markExerciseSetAsCompleted(
    { exerciseId: exercise.id },
    setIndex + 1,
    trainingInProgress.exerciseSetTrackingState,
    setTrainingInProgress,
    exercise.sets[setIndex].recTime
  );

  const supersetIndex =
    trainingInProgress.selectedComponent.supersets.findIndex((superset) =>
      superset.exercises.find((ex) => ex.id === exercise.id)
    );

  if (supersetIndex === -1) {
    toast.error('Superset not found');
    return;
  }

  await handleUpsertSet(workload, {
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
      return (
        key.completedSetNumbers.find((s) => s.setNumber === setNumber) !==
        undefined
      );
  }
  return false;
};

export const markExerciseSetAsCompleted = (
  exerciseIdentifier: { exerciseId: string },
  setNumber: number,
  exerciseSetTrackingState: ExerciseSetTracking[],
  setTrainingInProgress: SetState<TrainingInProgress | null>,
  recTime?: number
) => {
  const key = Array.from(exerciseSetTrackingState).find(
    (k) => k.exerciseId === exerciseIdentifier.exerciseId
  );

  if (key) {
    const completedSets = key.completedSetNumbers || [];
    if (!completedSets.find((s) => s.setNumber === setNumber)) {
      completedSets.push({ setNumber, timestamp: new Date() });
      key.completedSetNumbers = completedSets;
    }
  } else
    exerciseSetTrackingState.push({
      ...exerciseIdentifier,
      completedSetNumbers: [{ setNumber, timestamp: new Date() }],
    });

  setTrainingInProgress((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      exerciseSetTrackingState,
      lastSetCompletedAt: recTime ? new Date() : prev.lastSetCompletedAt,
      lastSetRecTimeS: recTime ?? prev.lastSetRecTimeS,
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
  const index = completedSets.findIndex((s) => s.setNumber === setNumber);
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
