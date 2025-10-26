import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Box, Chip, MenuItem, Select, Tooltip } from '@mui/material';
import type {
  GridColDef,
  GridRowId,
  GridRowModel,
  GridRowModesModel,
} from '@mui/x-data-grid';
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
} from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import type { AuthUser, UpdateUser } from '@/core/auth/type/user.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import ImageUpload from '@/ui/image-upload';

interface UsersDataGridProps {
  users: AuthUser[];
  filter?: (user: AuthUser) => boolean;
  displayColumns?: (keyof AuthUser | 'actions' | 'role')[];
  onRowClick?: (user: AuthUser) => void;
  onRowUpdate?: (
    userId: string,
    changes: UpdateUser & { role?: UserRole }
  ) => Promise<void>;
  selectMode?: boolean;
  initialSelection?: string[];
  onSelectToggle?: (user: AuthUser, selected: boolean) => void;
}

const roleColors: Record<
  UserRole,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  [UserRole.ADMIN]: 'default',
  [UserRole.MANAGER]: 'error',
  [UserRole.TRAINER]: 'secondary',
  [UserRole.ATHLETE]: 'default',
};

export default function UsersDataGrid({
  users,
  filter,
  displayColumns,
  onRowClick,
  onRowUpdate,
  selectMode,
  initialSelection,
  onSelectToggle,
}: UsersDataGridProps) {
  const [model, setModel] = useState<GridRowModesModel>({});
  const [rows, setRows] = useState(() =>
    users.filter((u) => (filter ? filter(u) : true))
  );

  useEffect(
    () => setRows(users.filter((u) => (filter ? filter(u) : true))),
    [users, filter]
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelection || [])
  );

  useEffect(() => {
    if (initialSelection) setSelectedIds(new Set(initialSelection));
  }, [initialSelection]);

  const toggleSelection = (user: AuthUser) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(user.uid)) newSet.delete(user.uid);
    else newSet.add(user.uid);
    setSelectedIds(newSet);
    onSelectToggle?.(user, newSet.has(user.uid));
  };

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

    const original = rows.find((u) => u.uid === id);
    if (original)
      setRows((prev) => prev.map((u) => (u.uid === id ? { ...original } : u)));
  };

  async function processRowUpdate(newRow: GridRowModel) {
    const oldRow = rows.find((u) => u.uid === newRow.id);
    if (!oldRow) return newRow;

    setRows((prev) =>
      prev.map((u) => (u.uid === newRow.id ? (newRow as AuthUser) : u))
    );

    const changes = Object.keys(newRow).reduce((acc, key) => {
      if (newRow[key] !== oldRow[key as keyof AuthUser] && key !== 'id')
        acc[key] = newRow[key];
      return acc;
    }, {} as Partial<GridRowModel>);

    if (Object.keys(changes).length === 0) return newRow;

    if (onRowUpdate) {
      try {
        const role = changes.customClaims?.role?.[0];
        await onRowUpdate(newRow.id as string, {
          ...(changes as UpdateUser),
          ...(role ? { role } : {}),
        });
      } catch (e) {
        console.error('Failed to update user:', e);
        toast.error('Failed to update user.');
        setRows((prev) => prev.map((u) => (u.uid === oldRow.uid ? oldRow : u)));
      }
    }

    return newRow;
  }

  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 70,
      getActions: ({ row, id }) => {
        if (selectMode) {
          const selected = selectedIds.has(row.uid);
          return [
            <GridActionsCellItem
              key="select"
              icon={
                <CheckCircleIcon
                  color={selected ? 'success' : 'disabled'}
                  sx={{ opacity: selected ? 1 : 0.4 }}
                />
              }
              label="Select"
              onClick={() => toggleSelection(row)}
              color="inherit"
            />,
          ];
        }

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
        ];
      },
    },
    {
      field: 'photoURL',
      headerName: 'Image',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const currentUrl = params.row.photoURL || USER_AVATAR_IMG_URL;
        const prevUrl = rows.find((u) => u.uid === params.row.uid)?.photoURL;
        const userId = params.row.uid;

        return (
          <ImageUpload
            key={params.row.photoURL}
            value={currentUrl}
            onChange={async (file) => {
              try {
                const path = `user/${userId}/${file.name}`;
                const url = await lib.firebase.storage.uploadFile(file, path);
                await onRowUpdate?.(userId, { photoURL: url });

                setRows((prev) =>
                  prev.map((u) =>
                    u.uid === userId ? { ...u, photoURL: url } : u
                  )
                );
              } catch (e) {
                console.error('Failed to upload image', e);
                toast.error('Failed to upload image');

                if (prevUrl)
                  setRows((prev) =>
                    prev.map((u) =>
                      u.uid === userId ? { ...u, photoURL: prevUrl } : u
                    )
                  );
              }
            }}
            size={48}
            round
            disableBorder
          />
        );
      },
    },
    {
      field: 'displayName',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      editable: !selectMode,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      editable: false,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      editable: !selectMode,
      renderCell: (params) => {
        const role = params.row.customClaims.role[0] as UserRole;
        return (
          <Tooltip title={role.toUpperCase()[0] + role.slice(1).toLowerCase()}>
            <Chip
              label={role.toUpperCase()[0]}
              color={roleColors[role]}
              size="small"
            />
          </Tooltip>
        );
      },
      renderEditCell: (params) => {
        return (
          <Select
            value={params.value ?? ''}
            onChange={(e) => {
              params.api.setEditCellValue({
                id: params.id,
                field: 'role',
                value: e.target.value,
              });
            }}
            size="small"
            sx={{
              width: '100%',
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              },
            }}
          >
            {[UserRole.ATHLETE, UserRole.TRAINER].map((role) => (
              <MenuItem key={role} value={role}>
                <Chip
                  label={role.charAt(0).toUpperCase()}
                  color={roleColors[role]}
                  size="small"
                />
                <Box ml={1}>
                  {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                </Box>
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
  ];

  return (
    <DataGrid
      getRowId={(row) => row.uid}
      rows={rows.map((u) => ({ ...u, id: u.uid }))}
      columns={
        displayColumns
          ? columns.filter((c) =>
              displayColumns.includes(c.field as keyof AuthUser)
            )
          : columns
      }
      pageSizeOptions={[5, 10, 25]}
      disableRowSelectionOnClick
      onRowClick={(params) =>
        !selectMode ? onRowClick?.(params.row as AuthUser) : undefined
      }
      editMode="row"
      rowModesModel={model}
      onRowModesModelChange={(newModel) => setModel(newModel)}
      processRowUpdate={processRowUpdate}
      onRowEditStop={(params, e) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut)
          e.defaultMuiPrevented = true;
      }}
      getRowClassName={(params) =>
        selectMode && selectedIds.has(params.row.uid) ? 'selected-row' : ''
      }
      sx={{
        m: -3,
        '& .selected-row': {
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
        },
      }}
    />
  );
}
