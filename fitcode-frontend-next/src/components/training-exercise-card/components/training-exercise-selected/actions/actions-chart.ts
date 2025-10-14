import type { UseTrainingExerciseCardChartReturnType } from '../hooks/use-chart.hook';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { VolType } from '@/controller/component/enum/param.enum';
import { IntType } from '@/controller/component/enum/param.enum';
import { ParamType } from '@/controller/component/enum/param.enum';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import type { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { WorkloadValue } from '@/controller/training/type/workload-value.type';
import type { GroupProviderReturnType } from '@/store/group.provider';
import type { TrainerDayViewProviderReturnTypeDefined } from '@/store/trainer-day-view.provider';

export function prepareSelectedAthleteAvgWorkloadsForChart(
  input: {
    exercise: TrainingExercise;
  },
  context: {
    useGroup: GroupProviderReturnType;
    useTrainerDayViewContext: TrainerDayViewProviderReturnTypeDefined;
    useChart: UseTrainingExerciseCardChartReturnType;
  }
) {
  const { useGroup, useTrainerDayViewContext, useChart } = context;

  const { exercise } = input;

  const { trainings } = useGroup;

  const {
    selectedAthleteCompletedWorkloads,
    training,
    component,
    selectedAthlete,
    selectedSubgroup,
  } = useTrainerDayViewContext;

  const { selectedParams, setChartData, setMax, setRange } = useChart;

  if (!selectedAthlete) return;

  const newData: ChartWorkloadData[] = [];

  trainings.forEach((t) => {
    if (!t.membersIds.includes(selectedAthlete.uid)) return;

    const name = getFormatedName(t.from);

    const chartWorkloadData: ChartWorkloadData = {
      trainingId: t.id,
      componentId: component.id,
      exerciseId: exercise.id,
      name,
      plannedAt: t.from,
    };

    const workloads: Workload[] = [];

    const isCustomWorkloadSubgroup =
      selectedSubgroup?.parentId &&
      selectedSubgroup.membersIds.includes(selectedAthlete.uid);

    if (t.id === training.id && isCustomWorkloadSubgroup) {
      // if its the current training, take the selectedSubgroup which is used
      // for custom athlete workloads
      selectedSubgroup.supersets.forEach((superset, i) => {
        superset.exercises.forEach((e) => {
          if (e.id !== exercise.id) return;

          e.sets.forEach((set) => {
            const workload: Workload = {
              groupId: training.groupId,
              cycleId: training.cycleId,
              userId: selectedAthlete.uid,
              trainingId: training.id,
              componentId: component.id,
              exerciseId: e.id,
              setNumber: set.setNumber,
              supersetIndex: i,
              status: SetStatus.NOT_STARTED,
              intWork1Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.IntWork1
              )?.selected as IntType,
              intWork2Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.IntWork2
              )?.selected as IntType,
              volWork1Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.VolWork1
              )?.selected as VolType,
              volWork2Type: set.paramValuesL.find(
                (paramValue) => paramValue.field === ParamType.VolWork2
              )?.selected as VolType,
              plannedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            for (const paramValue of set.paramValuesL) {
              const fieldName = getWorkloadFieldName(paramValue, true);

              if (!fieldName) continue;

              workload[fieldName] = Number(paramValue.value);
            }

            workloads.push(workload);
          });
        });
      });

      const workloadData = prepareWorkloadsForData(
        workloads,
        exercise,
        selectedParams,
        t.id,
        chartWorkloadData
      );

      newData.push(workloadData);

      return;
    }

    // first check in selectedAthleteWorkloads, which are set in the current session
    // completedWorkloads

    const foundCompletedSelectedAthleteWorkloads =
      selectedAthleteCompletedWorkloads.filter(
        (w) =>
          w.exerciseId === exercise.id &&
          w.componentId === component.id &&
          w.trainingId === t.id
      );

    if (foundCompletedSelectedAthleteWorkloads.length)
      workloads.push(...foundCompletedSelectedAthleteWorkloads);

    // third check in main group or subgroup of the training

    const trainingComponent = t.components.find((c) => c.id === component.id);

    if (!trainingComponent) return;

    const subgroups = trainingComponent.subgroups.filter((s) =>
      s.membersIds.includes(selectedAthlete.uid)
    );

    let subgroup = undefined;

    if (subgroups.length) {
      const parentIdSubgroup = subgroups.find((s) => s.parentId);
      if (parentIdSubgroup) subgroup = parentIdSubgroup;
      else subgroup = subgroups[0];
    }

    const foundExercise: TrainingExercise | undefined = subgroup
      ? subgroup.supersets
          .flatMap((s) => s.exercises)
          .find((e) => e.id === exercise.id)
      : trainingComponent.supersets
          .flatMap((s) => s.exercises)
          .find((e) => e.id === exercise.id);

    if (!foundExercise) return;

    foundExercise.sets.forEach((set) => {
      // check if data is in the array already for the current set
      if (
        workloads.some(
          (w) =>
            w.setNumber === set.setNumber &&
            w.exerciseId === foundExercise.id &&
            w.componentId === component.id &&
            w.trainingId === t.id
        )
      )
        return;

      const workload: Workload = {
        trainingId: t.id,
        componentId: component.id,
        exerciseId: foundExercise.id,
        setNumber: set.setNumber,
        plannedAt: t.from,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: selectedAthlete.uid,
        supersetIndex: 0,
        status: SetStatus.NOT_STARTED,
        intWork1Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.IntWork1
        )?.selected as IntType,
        intWork2Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.IntWork2
        )?.selected as IntType,
        volWork1Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.VolWork1
        )?.selected as VolType,
        volWork2Type: set.paramValuesL.find(
          (paramValue) => paramValue.field === ParamType.VolWork2
        )?.selected as VolType,
      };

      for (const paramValue of set.paramValuesL) {
        const fieldName = getWorkloadFieldName(paramValue, true);

        if (!fieldName) continue;

        workload[fieldName] = Number(paramValue.value);
      }

      workloads.push(workload);
    });

    const workloadData = prepareWorkloadsForData(
      workloads,
      exercise,
      selectedParams,
      t.id,
      chartWorkloadData
    );
    newData.push(workloadData);
  });

  // sort by plannedAt
  newData.sort((a, b) => {
    const dateA = new Date(a.plannedAt);
    const dateB = new Date(b.plannedAt);
    return dateA.getTime() - dateB.getTime();
  });

  setChartData(newData);
  setMax(newData.length);
  setRange([1, newData.length]);
}

export function prepareGroupAvgWorkloadsForChart(
  input: {
    exercise: TrainingExercise;
    componentId: string;
  },
  context: {
    useGroup: GroupProviderReturnType;
    useTrainerDayViewContext: TrainerDayViewProviderReturnTypeDefined;
    useChart: UseTrainingExerciseCardChartReturnType;
  }
) {
  const { exercise, componentId } = input;

  const { useGroup, useTrainerDayViewContext, useChart } = context;

  const { trainings } = useGroup;

  const { training } = useTrainerDayViewContext;

  const { selectedParams, setChartData, setMax, setRange } = useChart;

  const newData: ChartWorkloadData[] = [];

  trainings.forEach((t) => {
    if (t.id === training.id) t = training;

    const name = getFormatedName(t.from);

    const chartWorkloadData: ChartWorkloadData = {
      trainingId: t.id,
      componentId,
      exerciseId: exercise.id,
      name,
      plannedAt: t.from,
    };

    const workloads: Workload[] = [];

    const foundExercises: {
      exercise: TrainingExercise;
      membersIds: string[];
    }[] = [];

    const component = t.components.find((c) => c.id === componentId);

    if (!component) return;

    // prioritize selected subgroup supersets, if its the custom workload subgroup (with parentId)
    const supersets = component.supersets;

    const foundExerciseInComponent = supersets
      .flatMap((s) => s.exercises)
      .find((e) => e.id === exercise.id);

    const membersIdsInMainComponent = t.membersIds.filter(
      (id) => !component.subgroups.flatMap((s) => s.membersIds).includes(id)
    );

    if (foundExerciseInComponent)
      foundExercises.push({
        exercise: foundExerciseInComponent,
        membersIds: membersIdsInMainComponent,
      });

    // if not a custom workload subgroup is selected,
    // then also take avgs of all subgroups to make up for the whole group avg
    component.subgroups.forEach((sg) => {
      const foundSubgroupExercis = sg.supersets
        .flatMap((s) => s.exercises)
        .find((e) => e.id === exercise.id);

      if (foundSubgroupExercis)
        foundExercises.push({
          exercise: foundSubgroupExercis,
          membersIds: sg.membersIds,
        });
    });

    if (!foundExercises.length) return;

    foundExercises.forEach((foundExercise) => {
      foundExercise.exercise.sets.forEach((set) => {
        // check if data is in the array already for the current set
        for (const memberId of foundExercise.membersIds) {
          if (
            workloads.some(
              (w) =>
                w.setNumber === set.setNumber &&
                w.exerciseId === foundExercise.exercise.id &&
                w.componentId === component.id &&
                w.trainingId === t.id &&
                w.userId === memberId
            )
          )
            return;

          const workload: Workload = {
            trainingId: t.id,
            componentId: component.id,
            exerciseId: foundExercise.exercise.id,
            setNumber: set.setNumber,
            plannedAt: t.from,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: memberId,
            supersetIndex: 0,
            status: SetStatus.NOT_STARTED,
            intWork1Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.IntWork1
            )?.selected as IntType,
            intWork2Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.IntWork2
            )?.selected as IntType,
            volWork1Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.VolWork1
            )?.selected as VolType,
            volWork2Type: set.paramValuesL.find(
              (paramValue) => paramValue.field === ParamType.VolWork2
            )?.selected as VolType,
          };

          for (const paramValue of set.paramValuesL) {
            const fieldName = getWorkloadFieldName(paramValue, true);

            if (!fieldName) continue;

            workload[fieldName] = Number(paramValue.value);
          }

          workloads.push(workload);
        }
      });
    });

    const workloadData = prepareWorkloadsForData(
      workloads,
      exercise,
      selectedParams,
      t.id,
      chartWorkloadData
    );
    newData.push(workloadData);
  });

  // sort by plannedAt
  newData.sort((a, b) => {
    const dateA = new Date(a.plannedAt);
    const dateB = new Date(b.plannedAt);
    return dateA.getTime() - dateB.getTime();
  });

  setChartData(newData);
  setMax(newData.length);
  setRange([1, newData.length]);
}

function getWorkloadFieldName(paramValue: AttributeValue, completed: boolean) {
  let fieldName:
    | keyof Pick<
        WorkloadValue,
        | 'intWork1ValueL'
        | 'prescribedIntWork1ValueL'
        | 'intWork2ValueL'
        | 'prescribedIntWork2ValueL'
        | 'volWork1ValueL'
        | 'prescribedVolWork1ValueL'
        | 'volWork2ValueL'
        | 'prescribedVolWork2ValueL'
      >
    | undefined = undefined;

  switch (paramValue.field) {
    case ParamType.IntWork1:
      fieldName = completed ? 'intWork1ValueL' : 'prescribedIntWork1ValueL';
      break;
    case ParamType.IntWork2:
      fieldName = completed ? 'intWork2ValueL' : 'prescribedIntWork2ValueL';
      break;
    case ParamType.VolWork1:
      fieldName = completed ? 'volWork1ValueL' : 'prescribedVolWork1ValueL';
      break;
    case ParamType.VolWork2:
      fieldName = completed ? 'volWork2ValueL' : 'prescribedVolWork2ValueL';
      break;
  }

  return fieldName;
}

function prepareWorkloadsForData(
  workloads: Workload[],
  exercise: TrainingExercise,
  selectedParams: ParamType[],
  trainingId: string,
  chartWorkloadData: ChartWorkloadData // has got trainingId, name, plannedAt, completed
): ChartWorkloadData {
  for (const param of exercise.params) {
    if (!selectedParams.includes(param.field as ParamType)) continue;

    // example: int1 param
    const paramValue = exercise.sets[0].paramValuesL.find(
      (p) => p.field === param.field
    );
    if (!paramValue) continue;

    if (paramValue.selected === IntType.Tempo) continue;

    let field:
      | keyof Pick<
          WorkloadValue,
          'intWork1Type' | 'intWork2Type' | 'volWork1Type' | 'volWork2Type'
        >
      | undefined = undefined;
    if (param.field === ParamType.IntWork1) field = 'intWork1Type';
    else if (param.field === ParamType.IntWork2) field = 'intWork2Type';
    else if (param.field === ParamType.VolWork1) field = 'volWork1Type';
    else if (param.field === ParamType.VolWork2) field = 'volWork2Type';

    const foundWorkload = workloads.find((w) => w.trainingId === trainingId);

    if (!field || !foundWorkload) continue;

    // should return for example the whole eff/tempo param
    const selectedParam = param.options?.find(
      (o) => o.field === foundWorkload[field]
    );
    if (!selectedParam) continue;

    const workloadFields = getWorkloadFields(paramValue);
    if (!workloadFields) continue;

    const preparedWorkloads = prepareWorkloadsForSingleParam(
      workloads,
      selectedParam,
      workloadFields
    );

    if (!preparedWorkloads) continue;

    const { avgValue, fullValue } = preparedWorkloads;

    switch (paramValue.field) {
      case ParamType.IntWork1:
        chartWorkloadData.int1 = Math.round(avgValue * 100) / 100;
        chartWorkloadData.int1FullValue = fullValue;
        break;
      case ParamType.IntWork2:
        chartWorkloadData.int2 = avgValue;
        chartWorkloadData.int2FullValue = fullValue;
        break;
      case ParamType.VolWork1:
        chartWorkloadData.vol1 = avgValue;
        chartWorkloadData.vol1FullValue = fullValue;
        break;
      case ParamType.VolWork2:
        chartWorkloadData.vol2 = avgValue;
        chartWorkloadData.vol2FullValue = fullValue;
        break;
      default:
        break;
    }
  }

  return chartWorkloadData;
}

function getWorkloadFields(paramValue: AttributeValue) {
  let workloadFields:
    | (keyof Pick<
        WorkloadValue,
        | 'intWork1ValueL'
        | 'prescribedIntWork1ValueL'
        | 'intWork2ValueL'
        | 'prescribedIntWork2ValueL'
        | 'volWork1ValueL'
        | 'prescribedVolWork1ValueL'
        | 'volWork2ValueL'
        | 'prescribedVolWork2ValueL'
      >)[]
    | undefined = undefined;

  switch (paramValue.field) {
    case ParamType.IntWork1:
      workloadFields = ['intWork1ValueL', 'prescribedIntWork1ValueL'];
      break;
    case ParamType.IntWork2:
      workloadFields = ['intWork2ValueL', 'prescribedIntWork2ValueL'];
      break;
    case ParamType.VolWork1:
      workloadFields = ['volWork1ValueL', 'prescribedVolWork1ValueL'];
      break;
    case ParamType.VolWork2:
      workloadFields = ['volWork2ValueL', 'prescribedVolWork2ValueL'];
      break;
    default:
      break;
  }

  return workloadFields;
}

function prepareWorkloadsForSingleParam(
  workloads: Workload[],
  selectedParam: Attribute,
  paramFields: (keyof Pick<
    WorkloadValue,
    | 'intWork1ValueL'
    | 'prescribedIntWork1ValueL'
    | 'intWork2ValueL'
    | 'prescribedIntWork2ValueL'
    | 'volWork1ValueL'
    | 'prescribedVolWork1ValueL'
    | 'volWork2ValueL'
    | 'prescribedVolWork2ValueL'
  >)[]
) {
  if (
    (selectedParam.type &&
      ![AttributeType.Number, AttributeType.Select].includes(
        selectedParam.type
      )) ||
    !paramFields.length
  )
    return;

  const validValues = workloads
    .map((w) => w[paramFields[0]] || w[paramFields[1]])
    .filter((v) => v !== undefined)
    .map((w) => (!w ? w : parseFloat(w.toString())));

  if (!validValues.length) return;

  let avgValue: number | undefined = undefined;
  let fullValue: string | undefined = undefined;

  const paramName =
    selectedParam.name[0].toUpperCase() +
    selectedParam.name.slice(1).toLowerCase();
  if (selectedParam.type === AttributeType.Number) {
    // get the avg number
    avgValue =
      validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
    fullValue = `${paramName}: ${Math.round(avgValue * 100) / 100}`;
  } else if (selectedParam.type === AttributeType.Select) {
    // get the most represented value/index (as number)
    const valueCounts = new Map<number, number>();

    validValues.forEach((val) => {
      valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
    });

    const [mostCommonValue] = Array.from(valueCounts.entries()).reduce(
      (acc, [val, count]) => (count > acc[1] ? [val, count] : acc),
      [0, 0] as [number, number]
    );

    avgValue = mostCommonValue;
    const valueName = selectedParam.options?.find(
      (o) => o.field === mostCommonValue.toString()
    )?.name;
    fullValue = `${paramName}: ${valueName}`;
  }

  if (avgValue === undefined) return;

  return {
    avgValue: Math.round(avgValue * 100) / 100,
    fullValue,
  };
}

function getFormatedName(plannedAt: Date) {
  const date = new Date(plannedAt);

  const day = date.getDate().toString().padStart(2, '0');
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  if (month[0] === '0') month = month.slice(1);

  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Final format: "DD MM, AM/PM"
  const formatted = `${day}.${month}. ${ampm}`;

  return formatted;
}
