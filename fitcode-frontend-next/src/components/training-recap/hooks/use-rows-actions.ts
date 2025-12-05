import { TrainingController } from '@/core/training/training.controller';
import { handleApiRequest, SetState } from '@/lib/common/type/state.type';
import {
  GridRowModesModel,
  GridRowSelectionModel,
  GridRowEditStopParams,
  MuiEvent,
  GridRowId,
  GridRowModes,
  GridRowModel,
} from '@mui/x-data-grid';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { DataGridWorkloadRow } from '../types/data-grid-workload-row';
import { useRouter } from 'next/navigation';
import { Workload } from '@/core/training/type/workload.type';
import { useTrainingRecap } from '@/store/training-recap.provider';
import { AuthUser } from '@/core/auth/type/user.type';
import { useMain } from '@/store/main.provider';

export default function useTrainingRecapRowsActions(
  rows: DataGridWorkloadRow[],
  setRows: SetState<DataGridWorkloadRow[]>,
  setDeletedWorkloads: SetState<Workload[]>
) {
  const { exercises } = useMain();
  const { workloads } = useTrainingRecap();

  // which rows are in edit / view mode
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  // which rows are selected (for delete)
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);

  // prevent auto-committing when focus leaves the row (ophandleSaveClicktional but common)
  const handleRowEditStop = (
    params: GridRowEditStopParams,
    event: MuiEvent
  ) => {
    if (params.reason === 'rowFocusOut') {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit },
    }));
  };

  const handleSaveClick = (id: GridRowId) => async () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View },
    }));
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
  };

  const handleDeleteClick = (id: GridRowId) => async () => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    const workload = workloads.find((w) => w.id === id);
    if (!workload) return;

    setDeletedWorkloads((prev) => [...prev, workload]);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const processRowUpdate = async (
    newRow: GridRowModel,
    setUpdatedWorkloads: SetState<Workload[]>
  ) => {
    const oldRow = rows.find((r) => r.id === newRow.id);
    if (!oldRow) return newRow;

    const foundWorkload = workloads.find((w) => w.id === newRow.id);
    if (!foundWorkload) return newRow;

    const updatedWorkload = {
      ...foundWorkload,
      reps: Number(newRow.reps),
      repsR:
        newRow.repsR !== null && !isNaN(Number(newRow.repsR))
          ? Number(newRow.repsR)
          : undefined,
      loadKg: Number(newRow.load),
      loadKgR:
        newRow.loadR !== null && !isNaN(Number(newRow.loadR))
          ? Number(newRow.loadR)
          : undefined,
    };

    if (
      updatedWorkload.repsR !== undefined ||
      updatedWorkload.loadKgR !== undefined
    ) {
      const exercise = exercises.find(
        (e) => e.id === updatedWorkload.exerciseId
      );
      if (exercise && !exercise.isUnilateral) {
        toast.error('Exercise is not unilateral, you cannot set R values.');
        return oldRow;
      }
    }

    setUpdatedWorkloads((prev) => {
      const otherWorkloads = prev.filter((w) => w.id !== updatedWorkload.id);
      return [...otherWorkloads, updatedWorkload];
    });

    let returnRow = newRow;

    setRows((prev) =>
      prev.map((r) =>
        r.id === newRow.id ? (newRow as DataGridWorkloadRow) : r
      )
    );

    return returnRow;
  };

  return {
    rowModesModel,
    setRowModesModel,
    rowSelectionModel,
    setRowSelectionModel,
    handleRowEditStop,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
    processRowUpdate,
  };
}
