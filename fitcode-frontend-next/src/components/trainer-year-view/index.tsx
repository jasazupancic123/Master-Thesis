'use client';

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import React from 'react';
import MultiCycleSlider from '@/components/multi-cycle-slider';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Button, Typography } from '@mui/material';
import dayjs from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import MyModal from '@/components/modal';
import EditCycleModal from '../edit-cycle-modal';
import { Cycle } from '@/controller/group/type/cycle.type';
import { FilterTypeViewProps } from '../../app/groups/[group_id]/type';
import { handleUpdateCycle } from './state';
import { useScreenSize } from '@/context/screen-size-provider';
import AddCycleModal from '../add-cycle-modal';

export default function TrainerYearView(props: FilterTypeViewProps) {
  const screenSize = useScreenSize();
  const {
    token,
    group,
    setSelectedGroup,
    users,
    groups,
    exercises,
    attributes,
    components,
  } = props;

  const theme = useTheme();
  const [showEditCycleModal, setShowEditCycleModal] = useState(false);
  const [showAddCycleModal, setShowAddCycleModal] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 5,
    page: 0,
  });

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
                setShowEditCycleModal(true);
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
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2, mb: 2 }}
          onClick={() => setShowAddCycleModal(true)}
        >
          Add Cycle
        </Button>

        <MultiCycleSlider
          token={token}
          groupId={group.id}
          cycles={group.cycles}
          selectedGroup={group}
          setSelectedGroup={setSelectedGroup}
        />

        <Typography variant="h6" gutterBottom mt={3}>
          Cycles
        </Typography>

        <Box
          sx={{
            width:
              !screenSize.isMobile && !screenSize.isLandscapeMobile
                ? '50%'
                : '90%',
            mt: 2,
            mb: 2,
          }}
        >
          <DataGrid
            rows={group.cycles}
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
          isOpen={showEditCycleModal}
          setIsOpen={(open) => setShowEditCycleModal(open)}
          onCancel={() => setShowEditCycleModal(false)}
          onConfirm={() =>
            handleUpdateCycle(
              token,
              group,
              setSelectedGroup,
              editCycle,
              setEditCycle,
              setShowEditCycleModal
            )
          }
          cancelText="Close"
        >
          <EditCycleModal
            token={token}
            selectedCycle={editCycle}
            setSelectedCycle={setEditCycle}
            onClose={() => {
              setShowEditCycleModal(false);
              setEditCycle(null);
            }}
          />
        </MyModal>
      )}

      <MyModal
        isOpen={showAddCycleModal}
        setIsOpen={(open) => setShowAddCycleModal(open)}
        onCancel={() => setShowAddCycleModal(false)}
        cancelText="Close"
      >
        <AddCycleModal
          token={token}
          onClose={() => setShowAddCycleModal(false)}
          selectedGroup={group}
          setSelectedGroup={setSelectedGroup}
        />
      </MyModal>

      {/* Add cycle modal */}
      <MyModal
        isOpen={showAddCycleModal}
        setIsOpen={(open) => setShowAddCycleModal(open)}
        onCancel={() => setShowAddCycleModal(false)}
        cancelText="Close"
      >
        <AddCycleModal
          token={token}
          onClose={() => setShowAddCycleModal(false)}
          selectedGroup={group}
          setSelectedGroup={setSelectedGroup}
        />
      </MyModal>
    </>
  );
}
