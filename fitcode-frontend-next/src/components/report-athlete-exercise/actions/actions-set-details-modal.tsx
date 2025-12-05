import { Workload } from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import DataGridCellPercentageDiff from '@/ui/data-grid-cell-percentage-diff';
import { GridColDef } from '@mui/x-data-grid';

type DataGridWorkloadDetailsRow = {
  name: string;
  prescribed: number | undefined;
  completed: number | undefined;
  int?: boolean;
};

export const setDetailsColumns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Parameter',
    flex: 1,
    minWidth: 134,
  },
  {
    field: 'prescribed',
    headerName: 'Prescribed',
    flex: 1,
    minWidth: 100,
    valueFormatter: (value?: number) =>
      value === undefined || value === null ? '-' : value,
  },
  {
    field: 'completed',
    headerName: 'Completed',
    flex: 1,
    minWidth: 100,
    valueFormatter: (value?: number) =>
      value === undefined || value === null || isNaN(Number(value))
        ? '-'
        : `${Number(value)?.toFixed(2)}%`,
    sortComparator: (v1, v2) => {
      if (v1 === null && v2 === null) return 0;
      if (v1 === null) return 1;
      if (v2 === null) return -1;
      return v1 - v2;
    },
    valueGetter: (_value, row) => {
      const presc = row.prescribed as number | undefined;
      const comp = row.completed as number | undefined;
      if (presc === undefined || comp === undefined) return undefined;

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
          value1={row.completed}
          value2={row.prescribed}
          fontSize={14}
        />
      );
    },
  },
];

export const getPrescribedCompletedPairs = (
  workload: Workload
): DataGridWorkloadDetailsRow[] => {
  return [
    {
      name: 'Load (kg)',
      prescribed: workload.prescribed.loadKg,
      completed: workload.loadKg,
    },
    {
      name: 'Load R (kg)',
      prescribed: workload.prescribed.loadKgR,
      completed: workload.loadKgR,
    },
    {
      name: 'Reps',
      prescribed: workload.prescribed.reps,
      completed: workload.reps,
      int: true,
    },
    {
      name: 'Reps R',
      prescribed: workload.prescribed.repsR,
      completed: workload.repsR,
      int: true,
    },
    {
      name: 'Recovery Time',
      prescribed: workload.prescribed.recTime,
      completed: workload.recTime,
    },
    {
      name: 'Recovery Time R',
      prescribed: workload.prescribed.recTimeR,
      completed: workload.recTimeR,
    },
    {
      name: 'Time',
      prescribed: workload.prescribed.time,
      completed: workload.time,
      int: true,
    },
    {
      name: 'Time R',
      prescribed: workload.prescribed.timeR,
      completed: workload.timeR,
      int: true,
    },
    {
      name: 'Tempo Con',
      prescribed: workload.prescribed.tempoCon,
      completed:
        workload.tempoCon !== undefined
          ? (workload.tempoCon.toFixed(2) as unknown as number)
          : undefined,
    },
    {
      name: 'Tempo Con R',
      prescribed: workload.prescribed.tempoConR,
      completed:
        workload.tempoConR !== undefined
          ? (workload.tempoConR.toFixed(2) as unknown as number)
          : undefined,
    },
    {
      name: 'Tempo Ecc',
      prescribed: workload.prescribed.tempoEcc,
      completed:
        workload.tempoEcc !== undefined
          ? (workload.tempoEcc.toFixed(2) as unknown as number)
          : undefined,
    },
    {
      name: 'Tempo Ecc R',
      prescribed: workload.prescribed.tempoEccR,
      completed:
        workload.tempoEccR !== undefined
          ? (workload.tempoEccR.toFixed(2) as unknown as number)
          : undefined,
    },
    {
      name: 'Tempo Iso',
      prescribed: workload.prescribed.tempoIso,
      completed:
        workload.tempoIso !== undefined
          ? (workload.tempoIso.toFixed(2) as unknown as number)
          : undefined,
    },
    {
      name: 'Tempo Iso R',
      prescribed: workload.prescribed.tempoIsoR,
      completed:
        workload.tempoIsoR !== undefined
          ? (workload.tempoIsoR.toFixed(2) as unknown as number)
          : undefined,
    },
    {
      name: 'Tempo Idle',
      prescribed: workload.prescribed.tempoIdle,
      completed:
        workload.tempoIdle !== undefined
          ? (workload.tempoIdle.toFixed(2) as unknown as number)
          : undefined,
    },
    {
      name: 'Tempo Idle R',
      prescribed: workload.prescribed.tempoIdleR,
      completed:
        workload.tempoIdleR !== undefined
          ? (workload.tempoIdleR.toFixed(2) as unknown as number)
          : undefined,
    },
  ].filter(
    (pair) => pair.prescribed !== undefined || pair.completed !== undefined
  );
};
