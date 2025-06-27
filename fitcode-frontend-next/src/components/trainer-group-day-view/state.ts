import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Method } from '@/controller/method/type/method.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { TrainingInfo } from '@/controller/training/type/training-info.type';
import { Training } from '@/controller/training/type/training.type';
import { Workload } from '@/controller/training/type/workload.type';
import { User } from '@/controller/user/type/user.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export async function handleUpdateMultipleTrainings(state: {
  token: string;
  todaysTrainings: Training[];
  setTodaysTrainings: SetState<Training[]>;
  setTrainings: SetState<TrainingInfo[]>;
  training: Training | undefined;
  setTraining: SetState<Training | undefined>;
  group: Group;
  cycle: Cycle | undefined;
  router: AppRouterInstance;
  customAthleteWorkloads: Workload[];
  setCustomAthleteWorkloads: SetState<Workload[]>;
  components: Component[];
  exercises: Exercise[];
  methods: Method[];
  setSelectedAthlete: SetState<User | undefined>;
  setDetectedChanges: SetState<boolean>;
}) {
  const {
    token,
    todaysTrainings,
    setTodaysTrainings,
    setTrainings,
    training,
    setTraining,
    group,
    cycle,
    router,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    components,
    exercises,
    methods,
    setSelectedAthlete,
    setDetectedChanges,
  } = state;

  const todaysTrainingsFiltered = todaysTrainings.filter(
    (t) => t !== undefined
  );

  await handleApiRequest(
    router,
    () =>
      TrainingController.batchUpdate(
        token,
        { groupId: group.id, cycleId: cycle!.id },
        todaysTrainingsFiltered,
        customAthleteWorkloads
      ),
    (newTrainings) => {
      const mappedTrainings = newTrainings.map((newTraining) => {
        const mapped = TrainingService.mapComponentsExercisesMethods(
          newTraining,
          components,
          exercises,
          methods
        );
        return mapped;
      });

      const minimalTrainings = mappedTrainings.map((t) =>
        TrainingService.convertFromTrainingToTrainingMinimal(t)
      );

      const current = mappedTrainings.find((t) => t.id === training?.id);
      if (current) setTraining(current);

      setTrainings((prev) =>
        prev.map((t) => {
          const newTraining = minimalTrainings.find((nt) => nt.id === t.id);
          return newTraining ? newTraining : t;
        })
      );

      setTodaysTrainings((prev) =>
        prev.map((t) => {
          const newTraining = mappedTrainings.find((nt) => nt.id === t.id);
          return newTraining ? newTraining : t;
        })
      );

      setSelectedAthlete(undefined);

      setCustomAthleteWorkloads([]);

      setDetectedChanges(false);
      toast.success('Trainings updated successfully');
    },
    undefined,
    'Error when updating training'
  );
}
