import { app } from '@/core/app.service';
import { SetStatus } from '@/core/training/enum/set-status.enum';
import type { ChartWorkloadData } from '@/core/training/type/chart-workload-data.type';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { Workload } from '@/core/training/type/workload.type';

export function getAthleteChart(
  athleteId: string,
  exercise: TrainingExercise,
  component: TrainingComponent,
  athleteTraining: Training, // be sure to pass the training returned by TrainingService.getTrainingByAthlete
  data: {
    trainings: Training[];
    workloads: Workload[];
    subgroup: Subgroup | null;
  }
): ChartWorkloadData[] {
  const result: ChartWorkloadData[] = [];

  for (const t of data.trainings) {
    if (!t.membersIds.includes(athleteId)) continue;

    const workloads: Omit<Workload, 'id' | 'prescribed'>[] = [];
    const item: ChartWorkloadData = {
      trainingId: t.id,
      componentId: component.id,
      exerciseId: exercise.id,
      timestamp: t.from,
      name: getFormatedName(t.from),
    };

    // add workloads for active training (in current session)
    workloads.push(
      ...data.workloads.filter(
        (w) =>
          w.userId === athleteId &&
          w.exerciseId === exercise.id &&
          w.trainingId === t.id &&
          w.componentId === component.id
      )
    );

    const foundExercise = athleteTraining.components
      .find((c) => c.id === component.id)
      ?.supersets.flatMap((s) => s.exercises)
      .find((e) => e.id === exercise.id);

    if (!foundExercise) continue; // do not add chart data for trainings without the exercise

    for (let i = 0; i < (foundExercise.sets?.length || 0); i++) {
      const set = foundExercise.sets[i];
      const found = workloads.find(
        (w) =>
          w.setNumber === set.setNumber &&
          w.userId === athleteId &&
          w.exerciseId === exercise.id &&
          w.componentId === component.id &&
          w.trainingId === t.id
      );

      // if workload for this set already exists (from active workloads), skip
      if (found) continue;

      workloads.push({
        groupId: athleteTraining.groupId,
        cycleId: athleteTraining.cycleId,
        userId: athleteId,
        trainingId: t.id,
        componentId: component.id,
        exerciseId: exercise.id,
        supersetIndex: 0, // superset index is not relevant here
        status: SetStatus.NOT_STARTED,
        timestamp: t.from,
        ...set,
      });
    }

    result.push({ ...item, ...getAggregatedWorkloadValues(workloads) });
  }

  return result.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function getGroupChart(
  exercise: TrainingExercise,
  component: TrainingComponent,
  training: Training,
  data: { trainings: Training[] }
): ChartWorkloadData[] {
  const result: ChartWorkloadData[] = [];

  for (const t of data.trainings) {
    const workloads: Omit<Workload, 'id' | 'prescribed'>[] = [];
    const item: ChartWorkloadData = {
      trainingId: t.id,
      componentId: component.id,
      exerciseId: exercise.id,
      timestamp: t.from,
      name: getFormatedName(t.from),
    };

    const mainComponent = t.components.find((c) => c.id === component.id);
    const exercises: (TrainingExercise & { membersIds: string[] })[] = [
      // add exercises from main group (main component)
      ...(mainComponent?.supersets || []).flatMap((s) =>
        s.exercises
          .filter((e) => e.id === exercise.id)
          .map((e) => ({
            ...e,
            membersIds: app.training.getMainMembers(training),
          }))
      ),
      // add exercises from subgroups
      ...(mainComponent?.subgroups || []).flatMap((subgroup) =>
        (subgroup.supersets || []).flatMap((s) =>
          s.exercises
            .filter((e) => e.id === exercise.id)
            .map((e) => ({
              ...e,
              membersIds: subgroup.membersIds,
            }))
        )
      ),
    ];

    // collect workloads for all members who did this exercise in this training
    for (const e of exercises)
      for (const userId of e.membersIds)
        for (const set of e.sets) {
          // check if data is in the array already for the current set
          const found = workloads.find(
            (w) =>
              w.setNumber === set.setNumber &&
              w.userId === userId &&
              w.exerciseId === exercise.id &&
              w.componentId === component.id &&
              w.trainingId === t.id
          );

          if (found) continue;

          workloads.push({
            groupId: training.groupId,
            cycleId: training.cycleId,
            userId,
            trainingId: t.id,
            componentId: component.id,
            exerciseId: exercise.id,
            supersetIndex: 0, // superset index is not relevant here
            status: SetStatus.NOT_STARTED,
            timestamp: t.from,
            ...set,
          });
        }

    result.push({ ...item, ...getAggregatedWorkloadValues(workloads) });
  }

  return result.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Calculates aggregated workload values (intensity and volume) from an array of workloads.
 * It calculates average intensity and volume, and also provides full value ranges.
 * @param workloads array of workloads to aggregate
 * @returns
 */
function getAggregatedWorkloadValues(
  workloads: Partial<Workload>[]
): Pick<ChartWorkloadData, 'int' | 'vol' | 'intFullValue' | 'volFullValue'> {
  const intValues = workloads
    .map((w) => w.loadKg || w.loadRm || w.loadBw)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  const volValues = workloads
    .map((w) => w.reps)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  return {
    int: avg(intValues),
    vol: avg(volValues),
    intFullValue: intValues.length
      ? `Int: ${Math.min(...intValues)} - ${Math.max(...intValues)}`
      : undefined,
    volFullValue: volValues.length
      ? `Vol: ${Math.min(...volValues)} - ${Math.max(...volValues)}`
      : undefined,
  };
}

/**
 * Calculates the average of an array of numbers.
 */
function avg(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

function getFormatedName(plannedAt: Date) {
  const date = new Date(plannedAt);

  const day = date.getDate().toString().padStart(2, '0');
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  if (month[0] === '0') month = month.slice(1);

  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${day}.${month}. ${ampm}`; // Final format: "DD MM, AM/PM"
}
