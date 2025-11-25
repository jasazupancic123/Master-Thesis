import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Avatar, AvatarGroup, Box, Chip, IconButton } from '@mui/material';
import type {
  GridColDef,
  GridRowId,
  GridRowModel,
  GridRowModesModel,
} from '@mui/x-data-grid';
import { DataGrid, GridActionsCellItem, GridRowModes } from '@mui/x-data-grid';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import type { Group, UpdateGroup } from '@/core/institution/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';

interface Props {
  institution: Institution;
  onRowUpdate?: (groupId: string, data: UpdateGroup) => Promise<void>;
  onRowDelete?: (groupId: string) => Promise<void>;
  onRowAdd?: (data: Group) => Promise<Group | undefined>;
}

export default function GroupsDataGrid({
  institution,
  onRowUpdate,
  onRowDelete,
  onRowAdd,
}: Props) {
  const [rows, setRows] = useState<Group[]>(() => institution.groups || []);
  const [model, setModel] = React.useState<GridRowModesModel>({});

  const users = [
    institution.owner,
    ...institution.trainers,
    ...institution.athletes,
  ];

  const handleEditClick = (id: GridRowId) => () => {
    setModel({ ...model, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => async () => {
    setModel({ ...model, [id]: { mode: GridRowModes.View } });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setModel({
      ...model,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const handleDeleteClick = (id: GridRowId) => async () => {
    const group = rows.find((r) => r.id === id);
    if (!group) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete group "${group.name}"?`
    );

    if (!confirmed) return;

    const prevState = { rows };
    setRows((prev) => prev.filter((r) => r.id !== id));

    try {
      await onRowDelete?.(id as string);
    } catch (e) {
      console.error('Optimistic update failed:', e);
      toast.error('Failed to delete group');
      setRows(prevState.rows);
    }
  };

  const handleAddGroup = async () => {
    const newGroup: Group = {
      id: `temp-id-${Math.random().toString(36).substring(2, 9)}`,
      institutionId: institution.id,
      name: 'New Group',
      trainerIds: [institution.trainers[0]?.uid ?? institution.owner.uid],
      membersIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      cycles: [],
    };

    const prevState = {
      rows: structuredClone(rows),
      model: structuredClone(model),
    };

    setRows((prev) => [newGroup, ...prev]);

    try {
      const created = await onRowAdd?.(newGroup);

      // set the new id from backend
      if (created)
        setRows((prev) =>
          prev.map((r) => (r.id === newGroup.id ? created : r))
        );
    } catch (e) {
      console.error('Optimistic update failed:', e);
      toast.error('Failed to add group');
      setRows(prevState.rows);
    }
  };

  const processRowUpdate = async (newRow: GridRowModel) => {
    const oldRow = rows.find((r) => r.id === newRow.id);
    if (!oldRow) return newRow;

    setRows((prev) =>
      prev.map((r) => (r.id === newRow.id ? (newRow as Group) : r))
    );

    if (onRowUpdate) {
      try {
        await onRowUpdate(newRow.id as string, newRow as Partial<Group>);
      } catch (e) {
        console.error('Failed to update group', e);
        toast.error('Failed to update group');
        setRows((prev) => prev.map((r) => (r.id === oldRow.id ? oldRow : r)));
      }
    }

    return newRow;
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 100,
      getActions: ({ id }) => {
        const isInEditMode = model[id]?.mode === GridRowModes.Edit;
        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key={0}
              icon={<SaveIcon />}
              label="Save"
              onClick={handleSaveClick(id)}
              color="primary"
            />,
            <GridActionsCellItem
              key={1}
              icon={<CancelIcon />}
              label="Cancel"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key={2}
            icon={<EditIcon />}
            label="Edit"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key={3}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="error"
          />,
        ];
      },
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      editable: true,
    },
    {
      field: 'trainerIds',
      headerName: 'Trainers',
      flex: 1,
      minWidth: 150,
      editable: false,
      valueOptions: (institution.trainers || []).map((t) => ({
        value: t.uid,
        label: t.displayName,
      })),
      renderCell: (params) => {
        const trainers = users.filter((u) => params.value?.includes(u.uid));
        return trainers?.length > 0 ? (
          <>
            {trainers.map((trainer) => (
              <Chip
                label={trainer.displayName?.[0]}
                size="small"
                key={trainer.uid}
              />
            ))}
          </>
        ) : null;
      },
    },
    {
      field: 'membersIds',
      headerName: 'Members',
      flex: 1,
      minWidth: 200,
      editable: false,
      renderCell: (params) => {
        return (
          <AvatarGroup
            total={params.value?.length || 0}
            max={5}
            spacing="medium"
          >
            {params.value?.map((id: string) => {
              const member = users.find((u) => u.uid === id);
              return member ? (
                <Avatar
                  key={id}
                  alt={member.displayName || ''}
                  src={member.photoURL || USER_AVATAR_IMG_URL}
                />
              ) : null;
            })}
          </AvatarGroup>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 1,
          position: 'absolute',
          top: -40,
          right: 0,
        }}
      >
        <IconButton color="primary" size="small" onClick={handleAddGroup}>
          <AddIcon />
        </IconButton>
      </Box>

      <DataGrid
        getRowId={(r) => r.id}
        rows={rows.map((r) => ({ ...r, id: r.id }))}
        columns={columns}
        editMode="row"
        rowModesModel={model}
        onRowModesModelChange={setModel}
        processRowUpdate={processRowUpdate}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
        sx={{ m: -3 }}
      />
    </Box>
  );
}
