import {
  AssessmentOutlined,
  CancelOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import { Avatar, Box, IconButton } from '@mui/material';
import type { GridColDef, GridRowModesModel } from '@mui/x-data-grid';
import { GridActionsCellItem, GridRowModes } from '@mui/x-data-grid';

import type { Workload } from '@/core/training/type/workload.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useTrainingRecap } from '@/store/training-recap.provider';

export default function useTrainingRecapColumns(
  rowModesModel: GridRowModesModel,
  handleEditClick: (id: string) => () => void,
  handleSaveClick: (id: string) => () => void,
  handleCancelClick: (id: string) => () => void,
  handleDeleteClick: (id: string) => () => void,
  setSelectedWorkload: (workload: Workload) => void,
  setOpenSelectedWorkloadModal: (open: boolean) => void
) {
  const { workloads } = useTrainingRecap();

  const columns: GridColDef[] = [
    {
      field: 'photoURL',
      headerName: '',
      flex: 0.4,
      renderCell: ({ row }) => {
        return (
          <Box
            width="100%"
            height="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Avatar
              key={row.id}
              alt={row.displayName || ''}
              src={row.photoURL || USER_AVATAR_IMG_URL}
              sx={{
                width: 34,
                height: 34,
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'displayName',
      headerName: 'Name',
      flex: 1,
    },
    {
      field: 'exerciseName',
      headerName: 'Exercise',
      flex: 1,
    },
    {
      field: 'setNumber',
      headerName: 'Set',
      flex: 0.5,
    },
    {
      field: 'reps',
      headerName: 'Reps',
      flex: 0.7,
      editable: true,
    },
    {
      field: 'repsR',
      headerName: 'Reps (R)',
      flex: 0.7,
      editable: true,
    },
    {
      field: 'load',
      headerName: 'Load',
      flex: 0.7,
      editable: true,
    },
    {
      field: 'loadR',
      headerName: 'Load (R)',
      flex: 0.7,
      editable: true,
    },
    {
      field: 'tempo',
      headerName: 'Tempo',
      flex: 1,
    },
    {
      field: 'tempoR',
      headerName: 'Tempo (R)',
      flex: 1,
    },
    {
      field: 'details',
      headerName: 'Details',
      flex: 0.5,
      renderCell: ({ row }) => {
        return (
          <Box
            height="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <IconButton
              onClick={() => {
                const foundWorkload = workloads.find((w) => w.id === row.id);
                if (foundWorkload) {
                  setSelectedWorkload(foundWorkload);
                  setOpenSelectedWorkloadModal(true);
                }
              }}
            >
              <AssessmentOutlined />
            </IconButton>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 100,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key={0}
              icon={<SaveOutlined />}
              label="Save"
              onClick={handleSaveClick(id as string)}
            />,
            <GridActionsCellItem
              key={1}
              icon={<CancelOutlined />}
              label="Cancel"
              onClick={handleCancelClick(id as string)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key={2}
            icon={<EditOutlined />}
            label="Edit"
            onClick={handleEditClick(id as string)}
            color="inherit"
          />,
          <GridActionsCellItem
            key={3}
            icon={<DeleteOutlined />}
            label="Delete"
            onClick={handleDeleteClick(id as string)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return { columns };
}
