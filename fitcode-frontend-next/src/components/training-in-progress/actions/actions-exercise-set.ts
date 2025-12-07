import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { createEmptyPartialWorkload } from '@/components/training-station/actions/actions-workload';
import { KeypointHistory } from '@/core/exercise-ai-prescriptions/class/keypoint-history';
import type { Rep } from '@/core/exercise-ai-prescriptions/type/rep.type';
import type { Training } from '@/core/training/type/training.type';
import type {
  RepImage,
  TrainingExercise,
  TrainingExerciseRecordedSet,
} from '@/core/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type {
  CreateWorkload,
  PartialRecordedWorkloadValues,
  PartialWorkload,
  Workload,
} from '@/core/training/type/workload.type';
import type { SetState } from '@/lib/common/type/state.type';

export const finishSet = async (state: {
  userId: string;
  exercise: TrainingExercise;
  supersetIndex: number;
  setIndex: number;
  imagesL: RepImage[];
  imagesR: RepImage[];
  workloads: Workload[];
  workloadInput: PartialRecordedWorkloadValues;
  newRecordedSets?: TrainingExerciseRecordedSet[];
  trainingInProgress?: TrainingInProgress;
  setTrainingInProgress?: SetState<TrainingInProgress | null>;
  isAiRecorded?: boolean;
  handleUpsertSet?: (
    body: CreateWorkload,
    state: {
      exerciseId: string;
      supersetIndex: number;
      setIndex: number;
      isAiRecorded?: boolean;
    },
    workloads: Workload[],
    recordedSets: TrainingExerciseRecordedSet[]
  ) => Promise<void>;

  // for training station view:
  stationsViewProps?: {
    individualTraining: Training;
    componentId: string;
    router: AppRouterInstance;
    handleUpsertSetFromStationView: (
      body: PartialWorkload,
      state: {
        exerciseId: string;
        supersetIndex: number;
        setIndex: number;
        isAiRecorded?: boolean;
      },
      router: AppRouterInstance
    ) => Promise<void>;
  };
}) => {
  const {
    userId,
    exercise,
    supersetIndex,
    setIndex,
    imagesL,
    imagesR,
    workloads,
    trainingInProgress,
    newRecordedSets,
    isAiRecorded,
    setTrainingInProgress,
    handleUpsertSet,
    stationsViewProps,
    workloadInput,
  } = state;

  const photoUrls = [];

  const imagesLength = Math.max(imagesL.length || 0, imagesR?.length || 0);

  for (let i = 0; i < imagesLength; i++) {
    if (imagesL && imagesL[i]) photoUrls.push(imagesL[i].url);

    if (imagesR && imagesR[i]) photoUrls.push(imagesR[i].url);
  }

  workloadInput.photoURLs = photoUrls;

  // TRAINING STATION VIEW
  if (stationsViewProps) {
    const {
      individualTraining,
      componentId,
      router,
      handleUpsertSetFromStationView,
    } = stationsViewProps;

    const workload = createEmptyPartialWorkload({
      training: individualTraining,
      workloads,
      userId: userId,
      componentId,
      exerciseId: exercise.id,
      setIndex,
      workloadInput,
    });

    if (!workload) return;

    await handleUpsertSetFromStationView(
      workload,
      {
        exerciseId: exercise.id,
        supersetIndex: workload.supersetIndex,
        setIndex,
      },
      router
    );

    return;
  }
  // TRAINING IN PROGRESS VIEW
  else if (handleUpsertSet && trainingInProgress) {
    const workload = createEmptyPartialWorkload({
      training: trainingInProgress?.training,
      workloads,
      userId: userId,
      componentId: trainingInProgress?.componentId,
      exerciseId: exercise.id,
      setIndex,
      workloadInput,
    });

    if (!workload) return;

    if (setTrainingInProgress) {
      markExerciseSetAsCompleted(
        setTrainingInProgress,
        exercise.sets[setIndex].recTime,
        newRecordedSets
      );
    }

    await handleUpsertSet(
      workload,
      {
        exerciseId: exercise.id,
        setIndex,
        supersetIndex,
        isAiRecorded,
      },
      workloads,
      newRecordedSets || trainingInProgress?.recordedSets || []
    );
  }
};

const markExerciseSetAsCompleted = (
  setTrainingInProgress: SetState<TrainingInProgress | null>,
  recTime?: number,
  newRecordedSets?: TrainingExerciseRecordedSet[]
) => {
  setTrainingInProgress((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      lastSetCompletedAt: recTime ? new Date() : prev.lastSetCompletedAt,
      lastSetRecTimeS: recTime ?? prev.lastSetRecTimeS,
      recordedSets: newRecordedSets ? newRecordedSets : prev.recordedSets,
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
