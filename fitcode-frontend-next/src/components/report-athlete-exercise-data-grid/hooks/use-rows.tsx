import { Box, Typography } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

import { PercentageCalculation } from '../enum/percentage-calculation.enum';
import type { DataGridRowAthleteExercise } from '../types/data-grid-row';
import { theme } from '@/app/style';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Cycle } from '@/core/group/type/cycle.type';
import { TrainingController } from '@/core/training/training.controller';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { Workload } from '@/core/training/type/workload.type';
import { useDashboard } from '@/store/dashboard.provider';

export default function useAthleteExerciseReportDataGridData(
  selectedAthlete: AuthUser | null,
  selectedCycles: Cycle[],
  selectedTraining: Training | null,
  selectedPercentageCalculation: PercentageCalculation,
  cache: Map<string, Workload[]>
) {
  const { selectedInstitution, trainings } = useDashboard();

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [rows, setRows] = useState<DataGridRowAthleteExercise[]>([]);

  const fontSize = 13;

  const percentageGetter = (row: DataGridRowAthleteExercise) => {
    const value = row.selectedTrainingReps;
    const avg =
      selectedPercentageCalculation === PercentageCalculation.CYCLE
        ? row.cyclesAvgReps
        : row.prescribedTrainingReps;

    if (value === null || value === undefined || !avg) return null;

    const diff = ((value - avg) / avg) * 100;
    return diff;
  };

  const renderCellWithPercentChange = (
    value: number | undefined,
    cycleAvg: number | undefined
  ) => {
    if (value === undefined) return '-';

    const percentChange =
      cycleAvg && value
        ? Math.round(((value - cycleAvg) / cycleAvg) * 100)
        : null;

    const isHigher = percentChange !== null && percentChange > 0;
    const isSame = percentChange === 0;

    const valueString = `${value !== undefined ? Math.round(value) : '-'}`;

    return (
      <Box display="flex" width="100%" height="100%" alignItems="center">
        <Typography component="span" lineHeight={1} fontSize={fontSize}>
          {valueString}
          {percentChange !== null ? (
            <Typography
              component="span"
              lineHeight={1}
              fontSize={fontSize}
              sx={{
                color: isSame
                  ? theme.palette.warning.main
                  : isHigher
                    ? theme.palette.success.main
                    : theme.palette.error.main,
                display: 'inline',
              }}
            >
              ({isHigher ? '+' : ''}
              {percentChange}%)
            </Typography>
          ) : (
            ''
          )}
        </Typography>
      </Box>
    );
  };

  useEffect(() => {
    if (!selectedAthlete || !selectedCycles.length || !selectedInstitution) {
      setRows([]);
      return;
    }

    const setupDataGridRows = async () => {
      setIsLoadingData(true);

      const rows = [] as DataGridRowAthleteExercise[];

      const athleteTrainings = trainings.filter((t) =>
        t.membersIds.includes(selectedAthlete.uid)
      );

      const uniquePossibleExercises: TrainingExercise[] = [
        ...new Set(
          athleteTrainings.flatMap((t) =>
            t.components.flatMap((c) => [
              ...c.supersets.flatMap((s) => s.exercises.map((e) => e)),
              ...c.subgroups
                .filter((s) => s.membersIds.includes(selectedAthlete.uid))
                .flatMap((sg) =>
                  sg.supersets.flatMap((ss) => ss.exercises.map((e) => e))
                ),
            ])
          )
        ),
      ].filter(
        (exercise, index, self) =>
          index === self.findIndex((e) => e.id === exercise.id)
      );

      for (const exercise of uniquePossibleExercises) {
        const key = `${selectedAthlete.uid}-${exercise.id}`;

        const currentWorkloads = cache.has(key)
          ? cache.get(key)!
          : await TrainingController.getInstance().getUserExerciseReport(
              selectedInstitution.id,
              selectedAthlete.uid,
              exercise.id
            );

        if (currentWorkloads && currentWorkloads.length)
          cache.set(key, currentWorkloads);

        const cycleWorkloads = currentWorkloads.filter((w) =>
          selectedCycles.some((c) => c.id === w.cycleId)
        );

        // Cycles avgs per training
        const evaluatedTrainings: {
          id: string;
          reps: number;
          tonnage: number;
        }[] = [];

        for (const workload of cycleWorkloads) {
          if (evaluatedTrainings.some((t) => t.id === workload.trainingId))
            continue;

          const trainingWorkloads = cycleWorkloads.filter(
            (w) => w.trainingId === workload.trainingId
          );

          let trainingTotalReps = 0;
          let trainingTotalTonnage = 0;

          for (const w of trainingWorkloads) {
            trainingTotalReps +=
              w.reps && w.repsR
                ? (w.reps + w.repsR) / 2
                : w.reps || w.repsR || 0;

            trainingTotalTonnage +=
              w.loadKg && w.loadKgR
                ? (w.loadKg + w.loadKgR) / 2
                : w.loadKg || w.loadKgR || 0;
          }

          evaluatedTrainings.push({
            id: workload.trainingId,
            reps: trainingTotalReps,
            tonnage: trainingTotalTonnage,
          });
        }

        const cyclesAvgReps =
          evaluatedTrainings.length > 0
            ? evaluatedTrainings.reduce((sum, t) => sum + t.reps, 0) /
              evaluatedTrainings.length
            : undefined;

        const cyclesAvgTonnage =
          evaluatedTrainings.length > 0
            ? evaluatedTrainings.reduce((sum, t) => sum + t.tonnage, 0) /
              evaluatedTrainings.length
            : undefined;

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
          cyclesAvgReps,
          cyclesAvgTonnage,
          selectedTrainingReps,
          selectedTrainingTonnage,
          prescribedTrainingReps,
          prescribedTrainingTonnage,
        });
      }

      const rowsWithValues = rows.filter(
        (r) =>
          r.cyclesAvgReps !== undefined ||
          r.cyclesAvgTonnage !== undefined ||
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
  }, [selectedAthlete, selectedCycles, selectedTraining, cache]);

  // 👇 Columns definition for DataGrid
  const columns: GridColDef<DataGridRowAthleteExercise>[] = [
    {
      field: 'exerciseName',
      headerName: 'Exercise',
      flex: 1.3,
      minWidth: 180,
    },
    {
      field: 'cyclesAvgReps',
      headerName: 'Cycles avg reps',
      flex: 0.7,
      minWidth: 140,
      valueFormatter: (value?: number) =>
        value !== undefined ? Math.round(value) : '-',
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
      valueGetter: (_value, row) => {
        return percentageGetter(row);
      },
      sortComparator: (v1, v2) => {
        if (v1 === null && v2 === null) return 0;
        if (v1 === null) return 1;
        if (v2 === null) return -1;
        return v1 - v2;
      },
      renderCell: (params) => {
        const { row } = params;

        return renderCellWithPercentChange(
          row.selectedTrainingReps,
          selectedPercentageCalculation === PercentageCalculation.CYCLE
            ? row.cyclesAvgReps
            : row.prescribedTrainingReps
        );
      },
    },
    {
      field: 'cyclesAvgTonnage',
      headerName: 'Cycles avg tonnage',
      flex: 0.9,
      minWidth: 160,
      valueFormatter: (value?: number) =>
        value !== undefined ? value.toFixed(1) : '-',
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
      valueGetter: (_value, row) => {
        return percentageGetter(row);
      },
      sortComparator: (v1, v2) => {
        if (v1 === null && v2 === null) return 0;
        if (v1 === null) return 1;
        if (v2 === null) return -1;
        return v1 - v2;
      },
      renderCell: (params) => {
        const { row } = params;

        return renderCellWithPercentChange(
          row.selectedTrainingTonnage,
          selectedPercentageCalculation === PercentageCalculation.CYCLE
            ? row.cyclesAvgTonnage
            : row.prescribedTrainingTonnage
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
