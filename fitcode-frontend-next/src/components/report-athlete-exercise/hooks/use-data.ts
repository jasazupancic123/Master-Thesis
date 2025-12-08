import { useEffect } from 'react';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import { TrainingController } from '@/core/training/training.controller';
import type { Workload } from '@/core/training/type/workload.type';
import type { User } from '@/core/user/type/user.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';

export default function useAthleteExerciseReportData(
  reportType: 'single' | 'comparison',
  selectedUser: User | null,
  selectedUsers: User[],
  selectedExercise: Exercise | null,
  cache: Map<string, Workload[]>,
  groupByTraining: boolean,
  setData: SetState<Workload[]>,
  setAllSetsData: SetState<Workload[]>
) {
  const { selectedInstitution } = useDashboard();

  async function getAthleteExerciseWorkloads(
    user: User,
    exercise: Exercise,
    key: string,
    averagePerTraining?: boolean // for comparison reports
  ): Promise<Workload[]> {
    const workloads = cache.has(key)
      ? cache.get(key)!
      : await TrainingController.getInstance().getExerciseWorkloadsByManyUsers(
          selectedInstitution!.id,
          exercise.id,
          [user.uid]
        );

    if (workloads && workloads.length) cache.set(key, workloads);

    if (!averagePerTraining) return workloads;

    const avgWorkloadsByTraining: Workload[] = [];

    for (const workload of workloads) {
      if (
        avgWorkloadsByTraining.find((w) => w.trainingId === workload.trainingId)
      )
        continue;

      const workloadsForTraining = workloads.filter(
        (w) => w.trainingId === workload.trainingId
      );

      const avgLoadKg =
        workloadsForTraining.reduce((sum, w) => sum + (w.loadKg || 0), 0) /
        workloadsForTraining.length;
      const avgReps =
        workloadsForTraining.reduce((sum, w) => sum + (w.reps || 0), 0) /
        workloadsForTraining.length;
      let avgLoadKgR: number | undefined =
        workloadsForTraining.reduce((sum, w) => sum + (w.loadKgR || 0), 0) /
        workloadsForTraining.length;
      let avgRepsR: number | undefined =
        workloadsForTraining.reduce((sum, w) => sum + (w.repsR || 0), 0) /
        workloadsForTraining.length;

      if (isNaN(avgLoadKgR) || avgLoadKgR === 0) avgLoadKgR = undefined;
      if (isNaN(avgRepsR) || avgRepsR === 0) avgRepsR = undefined;

      avgWorkloadsByTraining.push({
        ...workload,
        loadKg: Math.round(avgLoadKg * 100) / 100,
        reps: Math.round(avgReps * 100) / 100,
        loadKgR: avgLoadKgR ? Math.round(avgLoadKgR * 100) / 100 : undefined,
        repsR: avgRepsR ? Math.round(avgRepsR * 100) / 100 : undefined,
      });
    }

    return avgWorkloadsByTraining;
  }

  useEffect(() => {
    const prepareChartData = async () => {
      if (reportType === 'single') {
        if (!selectedUser || !selectedExercise) {
          setData([]);
          return;
        }

        const key = `${selectedUser.uid}-${selectedExercise.id}`;

        const allSetsData = await getAthleteExerciseWorkloads(
          selectedUser,
          selectedExercise,
          key
        );

        let workloads: Workload[] = allSetsData;

        if (groupByTraining)
          workloads = await getAthleteExerciseWorkloads(
            selectedUser,
            selectedExercise,
            key,
            groupByTraining
          );

        setData(workloads);
        setAllSetsData(allSetsData);
      } else if (reportType === 'comparison') {
        if (selectedUsers.length === 0 || !selectedExercise) {
          setData([]);
          return;
        }

        const allWorkloads: Workload[] = [];

        for (const user of selectedUsers) {
          const key = `${user.uid}-${selectedExercise.id}`;

          const workloads = await getAthleteExerciseWorkloads(
            user,
            selectedExercise,
            key,
            true
          );

          allWorkloads.push(...workloads);
        }

        setData(allWorkloads);
        setAllSetsData([]);
      }
    };

    prepareChartData();
  }, [
    reportType,
    selectedUser,
    selectedUsers,
    selectedExercise,
    selectedInstitution,
    groupByTraining,
  ]);
}
