'use client';

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import React from 'react';
import MultiCycleSlider from '@/components/multi-cycle-slider';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Typography } from '@mui/material';
import dayjs from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import MyModal from '@/components/modal';
import EditCycleModal from '../edit-cycle-modal';
import { toast } from 'react-hot-toast';
import { Cycle } from '@/controller/group/type/cycle.type';
import { GroupController } from '@/controller/group/group.controller';
import { GroupIdPageProps } from '../../app/groups/[group_id]/type';
import { handleUpdateCycle } from './state';

export default function TrainerYearView(props: GroupIdPageProps) {
  const { token, groupId, users, groups, exercises, attributes, components } =
    props;

  const theme = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 5,
    page: 0,
  });

  const [selectedGroup, setSelectedGroup] = useState(
    () => groups.find((g) => g.id === groupId)!
  );

  const columns: GridColDef[] = [
    {
      field: 'icon',
      headerName: '',
      flex: 1,
      maxWidth: 50,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: true,
      renderCell: (_) => {
        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
          >
            <RotateRightIcon
              style={{
                backgroundColor: theme.palette.primary.main,
                padding: 1,
                cursor: 'pointer',
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'name',
      headerName: 'Cycle Name',
      flex: 1,
      minWidth: 130,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'from',
      headerName: 'Start Date',
      flex: 1,
      minWidth: 130,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value, row) => {
        return dayjs(row.from).format('DD/MM/YYYY');
      },
    },
    {
      field: 'to',
      headerName: 'End Date',
      flex: 1,
      minWidth: 130,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value, row) => {
        return dayjs(row.to).format('DD/MM/YYYY');
      },
    },
    {
      field: 'edit',
      headerName: '',
      flex: 1,
      maxWidth: 50,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
          >
          <EditIcon
            style={{
              backgroundColor: theme.palette.primary.main,
              padding: 1,
              cursor: 'pointer',
            }}
            onClick={() => {
              setShowEditModal(true);
              setEditCycle(params.row as Cycle);
            }}
          />
          </Box>
        );
      },
    },
  ];

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        mb={3}
        pb={3}
      >
        <MultiCycleSlider
          token={token}
          groupId={groupId}
          cycles={selectedGroup.cycles}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
        />

        <Typography variant="h6" gutterBottom mt={3}>
          Cycles
        </Typography>

        <Box sx={{ width: '50%', mt: 2, mb: 2 }}>
          <DataGrid
            rows={selectedGroup.cycles}
            columns={columns}
            getRowId={(row) => row.id}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10]}
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: 'No cycles found.' }}
            sx={{
              '& .MuiDataGrid-root': {
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontSize: '16px',
                fontWeight: 'bold',
                borderBottom: `2px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-cell': {
                fontSize: '14px',
                color: theme.palette.text.primary,
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiPaginationItem-root': {
                color: theme.palette.text.secondary,
              },
            }}
          />
        </Box>
      </Box>

      {editCycle && (
        <MyModal
          isOpen={showEditModal}
          setIsOpen={(open) => setShowEditModal(open)}
          onCancel={() => setShowEditModal(false)}
          onConfirm={() =>
            handleUpdateCycle(
              token,
              selectedGroup,
              setSelectedGroup,
              editCycle,
              setEditCycle,
              setShowEditModal
            )
          }
          cancelText="Close"
        >
          <EditCycleModal
            token={token}
            selectedCycle={editCycle}
            setSelectedCycle={setEditCycle}
            onClose={() => {
              setShowEditModal(false);
              setEditCycle(null);
            }}
          />
        </MyModal>
      )}
    </>
  );
}
