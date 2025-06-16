import { CommonService } from '@/common/service/common.service';
import dayjs, { Dayjs } from 'dayjs';
import { handleCreateTraining } from '../trainer-cycle-view/state';
import { Training } from '@/controller/training/type/training.type';
import { addMinutes, setHours, setMinutes } from 'date-fns';
import {
  handleApiRequest,
  SetState,
  SetStateNullable,
} from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import toast from 'react-hot-toast';
import { TrainingService } from '@/controller/training/training.service';
import { COLORS } from '@/common/constant/color.constant';
import { handleCopyComponentApiRequest } from '../training-component-layout/state';
import { Group } from '@/controller/group/type/group.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Method } from '@/controller/method/type/method.type';
import { Target } from '@/controller/target/type/target.type';
import { Component } from '@/controller/component/type/component.type';
import { Day } from '@/common/service/util/date.util';
import { TrainingInfo } from '@/controller/training/type/training-info.type';

export async function handleClickDateCell(
  input: {
    date: Dayjs;
    period: string;
  },
  state: {
    token: string;
    router: AppRouterInstance;
    group: Group;
    cycle?: Cycle;
    componentCalendarView?: boolean;
    periodizationView?: boolean;
    copyComponent?: boolean;
    trainingComponent?: TrainingComponent;
    training?: Training;
    trainings: TrainingInfo[];
    components: Component[];
    allExercises: Exercise[];
    methods: Method[];
    selected?: Component[];
    selectedTargets?: {
      componentId: string;
      target: Target;
    }[];
    day?: Day;
    setTrainings: SetState<TrainingInfo[]>;
    setTodaysTrainings?: SetState<Training[]>;
    setCycle: SetStateNullable<Cycle>;
    setOpenOverwriteModal?: SetState<boolean>;
    setTrainingInPeriodForModal?: SetState<TrainingInfo | null>;
  }
) {
  const { date, period } = input;
  const {
    token,
    router,
    group,
    cycle,
    componentCalendarView,
    periodizationView,
    copyComponent,
    trainingComponent,
    training,
    trainings,
    components,
    allExercises,
    methods,
    selected,
    selectedTargets,
    day,
    setTrainings,
    setTodaysTrainings,
    setCycle,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
  } = state;

  if (componentCalendarView) {
    const trainingInPeriod = trainings.find((t) => {
      const trainingDate = dayjs(t.from);
      return (
        trainingDate.isSame(date, 'day') && trainingDate.format('A') === period
      );
    });
    const trainingInPeriodIncludesComponent = trainingInPeriod?.components.find(
      (c) => c.component?.id === trainingComponent?.component?.id
    );

    if (trainingInPeriod && !trainingInPeriodIncludesComponent) {
      // ADD THE SELECTED TRAINING COMPONENT TO THE TRAINING
      if (copyComponent && training && day && setTodaysTrainings) {
        handleCopyComponentApiRequest(
          {
            training,
            trainingInPeriod,
            component: trainingComponent!,
          },
          {
            token,
            router,
            allComponents: components,
            allExercises,
            allMethods: methods,
            setTrainings,
            setTodaysTrainings,
            day,
          }
        );
      }
    } else if (trainingInPeriod && trainingInPeriodIncludesComponent) {
      // ASK USER IF OVERWRITE THE TRAINING COMPONENT
      if (setOpenOverwriteModal && setTrainingInPeriodForModal) {
        setTrainingInPeriodForModal(trainingInPeriod);
        setOpenOverwriteModal(true);
      }
    } else if (!trainingInPeriod) {
      // ADD A NEW TRAINING WITH THE SELECTED TRAINING COMPONENT
      if (!training) {
        toast.error('Training not found');
        return;
      }
      if (!trainingComponent) {
        toast.error('Training component not found');
        return;
      }
      if (!group || !cycle) {
        toast.error('Group or cycle not found');
        return;
      }

      const from =
        period === 'AM'
          ? dayjs(date).set('hour', 8).toDate()
          : dayjs(date).set('hour', 14).toDate();
      const to = dayjs(from).add(30, 'minutes').toDate();

      const newTrainingComponent = {
        ...trainingComponent,
        from,
        to,
      };

      handleApiRequest(
        router,
        () =>
          TrainingController.copyComponent(token, {
            copyFromTrainingId: training.id,
            componentId: newTrainingComponent.id,
            from,
          }),
        (training_) => {
          const newTraining = TrainingService.mapComponentsExercisesMethods(
            training_,
            components,
            allExercises,
            methods
          );

          const minimalTraining =
            TrainingService.convertFromTrainingToTrainingMinimal(newTraining);

          const sortedTrainings = [...trainings, minimalTraining].sort(
            (a, b) => {
              const aDate = new Date(a.from);
              const bDate = new Date(b.from);
              return aDate.getTime() - bDate.getTime();
            }
          );

          if (day?.date.isSame(newTraining.from, 'day') && setTodaysTrainings) {
            setTodaysTrainings((prev) =>
              [...prev, newTraining].sort((a, b) => {
                const aDate = new Date(a.from);
                const bDate = new Date(b.from);
                return aDate.getTime() - bDate.getTime();
              })
            );
          }

          setTrainings(sortedTrainings);
          toast.success('Training with current component created successfully');
        },
        undefined,
        'Failed to create training with current component'
      );
    }
  } else if (periodizationView) {
    // do nothing
    return;
  } else {
    if (
      !cycle ||
      !CommonService.instance.date.isBetween(date, cycle.from, cycle.to)
    )
      return;

    handleAddTraining(
      { date, period: period as 'AM' | 'PM' },
      {
        token,
        group,
        cycle,
        selected,
        selectedTargets,
        router,
        setCycle,
        trainings,
        setTrainings,
        components,
        allExercises: allExercises,
        methods,
      }
    );
  }
}

export function getFilteredTrainings(
  input: { date: dayjs.Dayjs },
  state: {
    periodizationView?: boolean;
    trainingComponent?: TrainingComponent;
    trainings: TrainingInfo[];
    selectedTrainings?: TrainingInfo[];
    date: Dayjs;
    selected?: Component[];
    period: string;
  }
) {
  let { date } = input;
  const {
    periodizationView,
    trainingComponent,
    trainings,
    selectedTrainings,
    date: inputDate,
    selected,
    period,
  } = state;

  if (periodizationView && selectedTrainings) {
    return trainings.filter((training_) => {
      const trainingDate = dayjs(training_.from);
      const start = trainingDate.startOf('day');
      const end = dayjs(training_.to).endOf('day');

      // Check if training falls within the given day
      const isBetween = CommonService.instance.date.isBetween(date, start, end);
      if (!isBetween) return false;

      // Apply AM/PM filtering
      if (period === 'AM') return trainingDate.hour() < 12; // Before noon
      if (period === 'PM') return trainingDate.hour() >= 12; // Noon or later

      return false;
    });
  }

  date = dayjs(date);

  const newFilteredTrainings = [];
  let colorIndex = 0;
  const evaluatedTrainingIds: { trainingId: string; colorIndex: number }[] = [];
  for (const ft of trainings) {
    for (const tc of ft.components) {
      if (!tc.copiedFrom) continue;
      const copiedFromTraining = trainings.find(
        (t) => t.id === tc.copiedFrom?.rootCopiedFromTrainingId
      );

      if (!copiedFromTraining) continue;
      const evaluatedTrainingId = evaluatedTrainingIds.find(
        (t) => t.trainingId === copiedFromTraining.id
      );

      if (evaluatedTrainingId)
        tc.color = COLORS[evaluatedTrainingId.colorIndex];
      else {
        evaluatedTrainingIds.push({
          trainingId: copiedFromTraining.id,
          colorIndex,
        });

        const rootTrainingComponent = copiedFromTraining.components.find(
          (c) => trainingComponent?.component?.id === c.component?.id
        );

        if (!rootTrainingComponent) continue;

        rootTrainingComponent.color = COLORS[colorIndex];
        tc.color = COLORS[colorIndex];
        colorIndex++;
      }
    }
    newFilteredTrainings.push(ft);
  }

  return newFilteredTrainings.filter((training) => {
    const trainingDate = dayjs(training.from);
    const start = trainingDate.startOf('day');
    const end = dayjs(training.to).endOf('day');

    // Check if training falls within the given day
    const isBetween = CommonService.instance.date.isBetween(date, start, end);
    if (!isBetween) return false;

    // Apply AM/PM filtering
    if (period === 'AM') return trainingDate.hour() < 12; // Before noon
    if (period === 'PM') return trainingDate.hour() >= 12; // Noon or later

    return false;
  });
}

function handleAddTraining(
  input: {
    date: Dayjs;
    period: 'AM' | 'PM';
  },
  state: {
    token: string;
    group: Group;
    cycle?: Cycle;
    selected?: Component[];
    selectedTargets?: {
      componentId: string;
      target: Target;
    }[];
    router: AppRouterInstance;
    setCycle: SetStateNullable<Cycle>;
    trainings: TrainingInfo[];
    setTrainings: SetState<TrainingInfo[]>;
    components: Component[];
    allExercises: Exercise[];
    methods: Method[];
  }
) {
  const { date, period } = input;
  const {
    token,
    group,
    cycle,
    selected,
    selectedTargets,
    router,
    setCycle,
    trainings,
    setTrainings,
    components,
    allExercises,
    methods,
  } = state;

  if (!selected) {
    toast.error('Please select at least one component to add');
    return;
  }

  let from = setMinutes(setHours(date.toDate(), period === 'AM' ? 8 : 14), 0);

  handleCreateTraining(
    token,
    {
      group,
      cycle: cycle!,
      date,
      period,
      selectedComponents: selected.map((c, i) => ({
        id: c.id,
        subgroups: [],
        completedMembersIds: [],
        supersets: [],
        from: addMinutes(from, i * 30),
        to: addMinutes(addMinutes(from, i * 30), 30),
        target: selectedTargets?.find((m) => m.componentId === c.id)?.target,
      })),
    },
    {
      router,
      setCycle,
      trainings,
      setTrainings,
      components,
      exercises: allExercises,
      methods,
    }
  );
}
