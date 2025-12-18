'use client';

import { Box, Typography, useTheme } from '@mui/material';
import type {
  GridColDef,
  GridRowModel,
  GridRowModesModel,
} from '@mui/x-data-grid';
import { DataGrid, GridRowEditStopReasons } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react';

import ExerciseChips from '../exercise-chips/exercise-chips';
import { MAX_WIDTH_DASHBOARD_ITEM } from '../trainer-group-day-view/constant/dimensions.constant';
import type { Component } from '@/core/exercise/type/component.type';
import type { Method } from '@/core/exercise/type/method.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  items: Method[];
  displayColumns?: (keyof Method)[];
  onRowClick?: (method: Method) => void;
  selectMode?: boolean;
  initialSelection?: string[];
  onSelectToggle?: (method: Method, selected: boolean) => void;
}

export default function MethodsDataGrid({
  items,
  displayColumns,
  onRowClick,
  selectMode,
  initialSelection,
}: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const [model, setModel] = useState<GridRowModesModel>({});
  const [rows, setRows] = useState(() => items);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelection || [])
  );

  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);

  useEffect(() => {
    if (!selectedComponents.length) {
      setRows(items);
      return;
    }

    const filtered = items.filter((method) =>
      selectedComponents.some(
        (component) => component.field === method.componentId
      )
    );
    setRows(filtered);
  }, [selectedComponents]);

  useEffect(() => {
    if (initialSelection) setSelectedIds(new Set(initialSelection));
  }, [initialSelection]);

  async function processRowUpdate(newRow: GridRowModel) {
    const oldRow = rows.find((u) => (u.field as string) === newRow.id);
    if (!oldRow) return newRow;

    setRows((prev) =>
      prev.map((u) =>
        (u.field as string) === newRow.id ? (newRow as Method) : u
      )
    );

    const changes = Object.keys(newRow).reduce((acc, key) => {
      if (newRow[key] !== oldRow[key as keyof Method] && key !== 'id')
        acc[key] = newRow[key];
      return acc;
    }, {} as Partial<GridRowModel>);

    if (Object.keys(changes).length === 0) return newRow;

    return newRow;
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Method',
      flex: 1,
      minWidth: 250,
      editable: false,
      renderCell: (params) => (
        <Typography fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Ability',
      flex: 2,
      sortable: false,
      filterable: false,
      minWidth: 300,
      renderCell: (params) => (
        <Typography variant="body2" color="white">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'attributesSummary',
      headerName: 'Constraints',
      flex: 2,
      minWidth: 500,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params.row as Method;
        const attrs = (row.attributes || []) as {
          field: string;
          min?: number;
          max?: number;
          pattern?: string;
          disabled?: boolean;
        }[];

        if (!attrs.length) return '';

        return attrs
          .map((a) => {
            if (a.disabled) return `${a.field}: —`;
            if (a.pattern) {
              // simplify regex for user-friendly display
              const readable = a.pattern
                .replace(/\^|\$/g, '')
                .replace(/\(\?:/g, '')
                .replace(/\)/g, '')
                .replace(/\[|\]/g, '')
                .replace(/\+/g, '')
                .replace(/\|/g, '–');
              return `${a.field}: ${readable}`;
            }

            if (a.min !== undefined && a.max !== undefined) {
              return a.min === a.max
                ? `${a.field}: ${a.min}`
                : `${a.field}: ${a.min}–${a.max}`;
            }

            return `${a.field}`;
          })
          .join(', ');
      },
    },
  ];

  return (
    <Box
      maxWidth={MAX_WIDTH_DASHBOARD_ITEM}
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ width: '100%', py: 2 }}
      gap={2}
    >
      <ExerciseChips
        selected={selectedComponents}
        bgColor={theme.palette.background.default}
        primaryColor={theme.palette.primary.main}
        setSelected={(component) =>
          setSelectedComponents(component as Component[])
        }
        cycleView
        gap={screenSize.isReallySmall ? 1.5 : 3.5}
        disabledComponents={['other', 'competition']}
      />

      <DataGrid
        style={{
          backgroundColor: theme.palette.background.paper,
        }}
        getRowId={(row) => row.field}
        rows={rows.map((u) => ({ ...u, id: u.field }))}
        columns={
          displayColumns
            ? columns.filter((c) =>
                displayColumns.includes(c.field as keyof Method)
              )
            : columns
        }
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        disableRowSelectionOnClick
        onRowClick={(params) =>
          !selectMode ? onRowClick?.(params.row as Method) : undefined
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
          '& .selected-row': { backgroundColor: 'rgba(25, 118, 210, 0.1)' },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-columnHeader': {
            display: 'flex',
            alignItems: 'center',
          },
          overflowY: 'hidden',
        }}
      />
    </Box>
  );
}
