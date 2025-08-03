'use client';

import CancelIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import type {
  GridColDef,
  GridRowModel,
  GridRowModesModel,
} from '@mui/x-data-grid';
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
} from '@mui/x-data-grid';
import React, { useState } from 'react';

import { ALL_ROLES } from '@/common/constant/user.constant';
import type { User } from '@/controller/user/type/user.type';

export default function Page() {
  // const users = useFetch<User[]>('user');
  const theme = useTheme();
  const users: User[] = [];
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const columns: GridColDef<User>[] = [
    { field: 'uid', headerName: 'ID', width: 280 },
    { field: 'email', headerName: 'E-mail', width: 250 },
    {
      field: 'emailVerified',
      headerName: 'Verified',
      width: 80,
      renderCell: ({ value }) => (value ? '✅' : '❌'),
    },
    { field: 'displayName', headerName: 'Name', width: 150 },
    {
      field: 'role',
      valueGetter: (_, row) => row.customClaims?.role?.[0],
      valueSetter: (newValue, row) => {
        row.customClaims = { ...row.customClaims, role: [newValue] };
        return row;
      },
      headerName: 'Role',
      width: 100,
      editable: true,
      type: 'singleSelect',
      valueOptions: ALL_ROLES,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode)
          return [
            <GridActionsCellItem
              key={0}
              icon={<SaveIcon />}
              label="Save"
              sx={{ color: theme.palette.primary.main }}
              onClick={() => {
                setRowModesModel({
                  ...rowModesModel,
                  [id]: { mode: GridRowModes.View },
                });
              }}
            />,
            <GridActionsCellItem
              key={1}
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={() => {
                setRowModesModel({
                  ...rowModesModel,
                  [id]: { mode: GridRowModes.View, ignoreModifications: true },
                });
              }}
              color="inherit"
            />,
          ];

        return [
          <GridActionsCellItem
            key={0}
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() =>
              setRowModesModel({
                ...rowModesModel,
                [id]: { mode: GridRowModes.Edit },
              })
            }
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <>
      <Box height={20} />

      <Box
        sx={{
          height: 500,
          width: '100%',
          '& .actions': { color: 'text.secondary' },
          '& .textPrimary': { color: 'text.primary' },
        }}
      >
        <DataGrid
          getRowId={(row) => row.uid}
          rows={users}
          columns={columns as GridColDef[]}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newRowModesModel: GridRowModesModel) =>
            setRowModesModel(newRowModesModel)
          }
          onRowEditStop={(params, event) => {
            if (params.reason === GridRowEditStopReasons.rowFocusOut)
              event.defaultMuiPrevented = true;
          }}
          processRowUpdate={async (newRow: GridRowModel<User>) => {
            const updatedRow = { ...newRow, isNew: false };
            // const userId = updatedRow.uid;
            return updatedRow;
          }}
        />
      </Box>
    </>
  );
}
