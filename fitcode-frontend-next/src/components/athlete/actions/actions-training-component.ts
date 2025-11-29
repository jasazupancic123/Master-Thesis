import { AuthUser } from '@/core/auth/type/user.type';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { Training } from '@/core/training/type/training.type';
import { lib } from '@/lib';
import { LINK_ATHLETE_HOME } from '@/lib/common/const/nav.const';
import { SetState } from '@/lib/common/type/state.type';
import { IMainContext } from '@/store/main.provider';
import {
  ITrainingsContext,
  TRAINING_IN_PROGRESS_STORAGE_KEY,
} from '@/store/trainings.provider';
import dayjs from 'dayjs';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { RefObject } from 'react';
import toast from 'react-hot-toast';

export async function startTrainingComponent(
  context: {
    useMain: IMainContext;
    useTrainings: ITrainingsContext;
  },
  state: {
    user: AuthUser;
    training: Training;
    selectedComponent: TrainingComponent | null;
    setOpen: SetState<boolean>;
    hasPlayedAudioRef: RefObject<boolean>;
    router: AppRouterInstance;
  }
) {
  const { useMain, useTrainings } = context;

  const { setTrainingInProgress } = useTrainings;
  const { exercises, activeTraining, setActiveTraining } = useMain;

  const {
    user,
    training,
    selectedComponent,
    setOpen,
    hasPlayedAudioRef,
    router,
  } = state;

  if (!selectedComponent) {
    toast.error('No component selected.');
    return;
  }

  let trainingToStart: Training | null = null;
  const controller = TrainingController.getInstance();

  try {
    if (activeTraining && activeTraining.id === training.id) {
      const isCompleted =
        activeTraining.statuses?.find(
          (s) =>
            s.componentId === selectedComponent.id &&
            s.trainingId === training.id
        )?.status === TrainingStatus.COMPLETED;

      if (isCompleted) {
        toast.error('This training component has already been completed.');

        setOpen(false);
        return;
      }
    }

    const isDifferentActiveTraining = activeTraining?.statuses.some(
      (a) => a.trainingId !== training.id
    );

    if (isDifferentActiveTraining) {
      toast.error(
        'Another training is already in progress. Please finish it before starting a new one.'
      );

      setOpen(false);

      return;
    }

    // restart training with new component
    const result = await controller.startTrainingComponent(
      training.id,
      selectedComponent.id
    );

    trainingToStart = result.trainings[user.uid];

    const errors = result.errors as unknown as {
      field: string;
      message: string;
    }[];

    if (errors && errors.length > 0) {
      toast.error(`Error: ${errors[0].message}`);
      setOpen(false);

      return;
    }
  } catch (e) {
    console.error(e);
    toast.error((e as Error).message || 'An error occurred.');
    return;
  }

  if (!trainingToStart) {
    toast.error('Failed to start training. Please try again.');
    return;
  }

  trainingToStart = TrainingService.mapData(trainingToStart, {
    exercises,
  });

  console.log('trainingToStart', trainingToStart);

  const component = trainingToStart.components.find(
    (c) => c.id === selectedComponent.id
  );

  if (!component) {
    toast.error('Selected component not found in training. Please try again.');

    return;
  }

  const newStatus = {
    id: `${trainingToStart.id}-${component.id}-${user.uid}`,
    trainingId: trainingToStart.id,
    componentId: component.id,
    status: TrainingStatus.IN_PROGRESS,
    userId: user.uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  setActiveTraining((prev) => {
    if (!prev)
      return {
        ...trainingToStart,
        workloads: [],
        statuses: [newStatus],
      };

    const foundStatus = prev.statuses?.find(
      (s) =>
        s.trainingId === trainingToStart!.id && s.componentId === component.id
    );

    return {
      ...prev,
      statuses: prev.statuses
        ? foundStatus
          ? prev.statuses.map((s) =>
              s.componentId === component.id &&
              s.trainingId === trainingToStart.id
                ? {
                    ...s,
                    status: TrainingStatus.IN_PROGRESS,
                    updatedAt: new Date(),
                  }
                : s
            )
          : [...prev.statuses, newStatus]
        : [newStatus],
    };
  });

  const foundTrainingInProgressObject = await lib.common.indexedDb.items.get(
    `${TRAINING_IN_PROGRESS_STORAGE_KEY}_${trainingToStart.id}_${component.id}`
  );

  const foundTrainingInProgress = foundTrainingInProgressObject
    ? JSON.parse(foundTrainingInProgressObject.payload)
    : null;

  console.log('new training in progress', {
    training: trainingToStart,
    selectedComponent: component,
    supersets: component.supersets,
    userId: user.uid,
    recordedSets: foundTrainingInProgress
      ? foundTrainingInProgress.recordedSets
      : [],
    startOfTraining: foundTrainingInProgress?.startOfTraining || dayjs(),
  });

  setTrainingInProgress({
    training: trainingToStart,
    selectedComponent: component,
    supersets: component.supersets,
    userId: user.uid,
    recordedSets: foundTrainingInProgress
      ? foundTrainingInProgress.recordedSets
      : [],
    startOfTraining: foundTrainingInProgress?.startOfTraining || dayjs(),
  } as TrainingInProgress);

  setOpen(false);

  if (hasPlayedAudioRef.current === false) {
    lib.common.audio.playSound('/sounds/training-in-progress-start.mp3');
    hasPlayedAudioRef.current = true;
  }

  router.push(
    `${LINK_ATHLETE_HOME.href}/${training.id}/components/${selectedComponent.id}`
  );
}
