import type { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

import type { DataGridRowAthleteExerciseRow } from '../types/data-grid-row';
import { core } from '@/core/core.service';
import { TrainingController } from '@/core/training/training.controller';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { Workload } from '@/core/training/type/workload.type';
import type { User } from '@/core/user/type/user.type';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';
import DataGridCellPercentageDiff from '@/ui/data-grid-cell-percentage-diff';

export default function useAthleteExerciseReportDataGridData(
  selectedAthlete: User | null,
  selectedTraining: Training | null,
  cache: Map<string, Workload[]>
) {
  const { selectedInstitution } = useDashboard();

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [rows, setRows] = useState<DataGridRowAthleteExerciseRow[]>([]);

  const fontSize = 13;

  useEffect(() => {
    if (!selectedAthlete || !selectedInstitution || !selectedTraining) {
      setRows([]);
      return;
    }

    const setupDataGridRows = async () => {
      setIsLoadingData(true);

      let workloads: Workload[] = [];
      try {
        workloads = await TrainingController.getInstance().getTrainingWorkloads(
          selectedTraining.id
        );
      } catch (e) {
        console.error('Error fetching workloads for training:', e);
      }

      const rows = [] as DataGridRowAthleteExerciseRow[];

      const possibleExercises: TrainingExercise[] = selectedTraining.components
        .map((c) => core.training.getAthleteSupersets(selectedAthlete.uid, c))
        .flatMap((supersets) =>
          supersets.flatMap((superset) => superset.exercises)
        );

      const uniquePossibleExercises: TrainingExercise[] = [];

      for (const exercise of possibleExercises) {
        if (!uniquePossibleExercises.find((e) => e.id === exercise.id))
          uniquePossibleExercises.push(exercise);
      }

      for (const exercise of uniquePossibleExercises) {
        const key = `${selectedAthlete.uid}-${exercise.id}`;
        const currentWorkloads = workloads.filter(
          (w) =>
            w.userId === selectedAthlete.uid &&
            w.exerciseId === exercise.exercise?.id
        );

        if (currentWorkloads.length) cache.set(key, currentWorkloads);

        // Selected training values
        const trainingWorkloads = currentWorkloads.filter(
          (w) => w.trainingId === selectedTraining?.id
        );

        let totalTrainingReps = 0;
        let totalTrainingLoad = 0;
        let trainingTotalPrescribedTrainingReps = 0;
        let trainingTotalPrescribedTrainingTonnage = 0;

        for (const w of trainingWorkloads) {
          totalTrainingReps +=
            w.reps && w.repsR ? (w.reps + w.repsR) / 2 : w.reps || w.repsR || 0;

          totalTrainingLoad +=
            w.loadKg && w.loadKgR
              ? (w.loadKg + w.loadKgR) / 2
              : w.loadKg || w.loadKgR || 0;

          trainingTotalPrescribedTrainingReps +=
            w.prescribed.reps && w.prescribed.repsR
              ? (w.prescribed.reps + w.prescribed.repsR) / 2
              : w.prescribed.reps || w.prescribed.repsR || 0;

          trainingTotalPrescribedTrainingTonnage +=
            w.prescribed.loadKg && w.prescribed.loadKgR
              ? (w.prescribed.loadKg + w.prescribed.loadKgR) / 2
              : w.prescribed.loadKg || w.prescribed.loadKgR || 0;
        }

        const selectedTrainingReps =
          totalTrainingReps > 0 ? totalTrainingReps : undefined;
        const selectedTrainingTonnage =
          totalTrainingLoad > 0 ? totalTrainingLoad : undefined;
        const prescribedTrainingReps =
          trainingTotalPrescribedTrainingReps > 0
            ? trainingTotalPrescribedTrainingReps
            : undefined;
        const prescribedTrainingTonnage =
          trainingTotalPrescribedTrainingTonnage > 0
            ? trainingTotalPrescribedTrainingTonnage
            : undefined;

        rows.push({
          exerciseId: exercise.id,
          exerciseName: exercise.exercise?.name || 'Unknown Exercise',
          selectedTrainingReps,
          selectedTrainingTonnage,
          prescribedTrainingReps,
          prescribedTrainingTonnage,
        });
      }

      const rowsWithValues = rows.filter(
        (r) =>
          r.selectedTrainingReps !== undefined ||
          r.selectedTrainingTonnage !== undefined
      );

      const rowsWithoutValues = rows.filter(
        (r) => !rowsWithValues.some((rwv) => rwv.exerciseId === r.exerciseId)
      );

      setRows([
        ...rowsWithValues.sort((a, b) =>
          a.exerciseName.localeCompare(b.exerciseName.trim())
        ),
        ...rowsWithoutValues.sort((a, b) =>
          a.exerciseName.localeCompare(b.exerciseName.trim())
        ),
      ]);

      setIsLoadingData(false);
    };

    setupDataGridRows();
  }, [selectedAthlete, selectedTraining, cache]);

  // Columns definition for DataGrid
  const columns: GridColDef<DataGridRowAthleteExerciseRow>[] = [
    {
      field: 'exerciseName',
      headerName: 'Exercise',
      flex: 1.3,
      minWidth: 180,
    },
    {
      field: 'prescribedTrainingReps',
      headerName: 'Prescribed reps',
      flex: 0.7,
      minWidth: 140,
      valueFormatter: (value?: number) =>
        value !== undefined ? Math.round(value) : '-',
    },
    {
      field: 'selectedTrainingReps',
      headerName: 'Session reps',
      flex: 0.7,
      minWidth: 140,
      valueFormatter: (value?: number) =>
        value === undefined || value === null ? '-' : `${value?.toFixed(2)}%`,
      valueGetter: (_value, row) => {
        const presc = row.selectedTrainingReps as number | undefined;
        const comp = row.prescribedTrainingReps;
        if (presc === undefined || comp === undefined) return null;

        const percentageDiff = lib.common.number.calculatePercentageDiff(
          comp,
          presc
        );

        return percentageDiff;
      },
      sortComparator: (v1, v2) => {
        if (v1 === null && v2 === null) return 0;
        if (v1 === null) return 1;
        if (v2 === null) return -1;
        return v1 - v2;
      },
      renderCell: (params) => {
        const { row } = params;

        return (
          <DataGridCellPercentageDiff
            value1={row.selectedTrainingReps}
            value2={row.prescribedTrainingReps}
            fontSize={fontSize}
            roundValue={true}
          />
        );
      },
    },
    {
      field: 'prescribedTrainingTonnage',
      headerName: 'Prescribed tonnage',
      flex: 0.9,
      minWidth: 160,
      valueFormatter: (value?: number) =>
        value !== undefined ? value.toFixed(1) : '-',
    },
    {
      field: 'selectedTrainingTonnage',
      headerName: 'Session tonnage',
      flex: 1,
      minWidth: 190,
      valueFormatter: (value?: number) =>
        value === undefined || value === null ? '-' : `${value?.toFixed(2)}%`,
      sortComparator: (v1, v2) => {
        if (v1 === null && v2 === null) return 0;
        if (v1 === null) return 1;
        if (v2 === null) return -1;
        return v1 - v2;
      },
      valueGetter: (_value, row) => {
        const presc = row.selectedTrainingTonnage as number | undefined;
        const comp = row.prescribedTrainingTonnage;
        if (presc === undefined || comp === undefined) return null;

        const percentageDiff = lib.common.number.calculatePercentageDiff(
          comp,
          presc
        );

        return percentageDiff;
      },
      renderCell: (params) => {
        const { row } = params;

        return (
          <DataGridCellPercentageDiff
            value1={row.selectedTrainingTonnage}
            value2={row.prescribedTrainingTonnage}
            fontSize={fontSize}
          />
        );
      },
    },
  ];

  return {
    isLoadingData,
    rows,
    columns,
  };
}
