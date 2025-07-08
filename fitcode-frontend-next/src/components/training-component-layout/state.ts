import toast from 'react-hot-toast';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import {
  TrainingComponent,
  TrainingComponentInfo,
} from '@/controller/training/type/training-plan.type';
import { TrainingService } from '@/controller/training/training.service';
import { Training } from '@/controller/training/type/training.type';
import { addMinutes } from 'date-fns';
import { Method } from '@/controller/method/type/method.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Day } from '@/common/service/util/date.util';
import dayjs from 'dayjs';
import { TrainingInfo } from '@/controller/training/type/training-info.type';
import { CopiedFrom } from '@/controller/training/type/copied-from.type';

export async function handleCopyComponentApiRequest(
  input: {
    training: Training;
    trainingInPeriod: TrainingInfo;
    component: TrainingComponent;
    override?: boolean;
  },
  state: {
    token: string;
    router: AppRouterInstance;
    allComponents: Component[];
    allExercises: Exercise[];
    allMethods: Method[];
    setTrainings: SetState<TrainingInfo[]>;
    day: Day;
  }
) {
  const { training, trainingInPeriod, component, override } = input;

  const {
    router,
    token,
    allComponents,
    allExercises,
    allMethods,
    setTrainings,
    day,
  } = state;

  let from;
  const componentInTraining = trainingInPeriod.components.find(
    (c) => c.id === component.id || c.component?.id === component.component?.id
  );
  let newComponents = [] as TrainingComponentInfo[];
  if (componentInTraining) {
    // replace the component in the training
    newComponents = [...trainingInPeriod.components].map((c) => {
      if (
        c.id === component.id ||
        c.component?.id === component.component?.id
      ) {
        from = c.from;
        return {
          ...component,
          from,
          to: addMinutes(from, 30),
          copiedFrom: {
            ...c.copiedFrom,
            lastCopiedFromTrainingId: training.id,
          } as CopiedFrom,
        };
      }
      return { ...c };
    });
  } else {
    // add the component to the training
    const lastComponentInTraining = {
      ...[...trainingInPeriod.components][
        trainingInPeriod.components.length - 1
      ],
    };
    const from = lastComponentInTraining
      ? addMinutes(new Date(lastComponentInTraining.from), 30)
      : trainingInPeriod.from;

    newComponents = [
      ...trainingInPeriod.components,
      {
        ...component,
        from: new Date(from),
        to: addMinutes(new Date(from), 30),
        copiedFrom: {
          rootCopiedFromTrainingId: training.id,
          lastCopiedFromTrainingId: training.id,
        } as CopiedFrom,
      },
    ];
  }

  handleApiRequest(
    router,
    () =>
      TrainingController.copyComponent(token, {
        copyFromTrainingId: training.id,
        copyToTrainingId: trainingInPeriod.id,
        componentId: component.id,
      }),
    (training) => {
      const mapped = TrainingService.mapComponentsExercisesMethods(
        training,
        allComponents,
        allExercises,
        allMethods
      );

      const minimalTraining =
        TrainingService.convertFromTrainingToTrainingMinimal(mapped);

      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === minimalTraining.id) return minimalTraining;
          return t;
        })
      );

      toast.success('Component copied successfully');
    },
    undefined,
    'Failed to copy component'
  );
}
