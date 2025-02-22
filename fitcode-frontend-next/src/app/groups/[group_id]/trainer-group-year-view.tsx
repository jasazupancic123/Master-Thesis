'use client';

import { handleApiRequest } from '@/common/type/state.type';
import EditCycleForm from '@/components/edit-cycle-form';
import MyModal from '@/components/modal';
import MultiCycleSlider from '@/components/multi-cycle-slider';
import CycleComponents from '@/components/training-year-view/cycle-components';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { GroupController } from '@/controller/group/group.controller';
import { Cycle } from '@/controller/group/type/cycle.type';
import EditIcon from '@mui/icons-material/Edit';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { Button, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function TrainerYearView() {
  const router = useRouter();
  const screenSize = useScreenSize();
  const { token, group, setGroup, setCycle } = useGroup();

  const theme = useTheme();
  const [showEditCycleModal, setShowEditCycleModal] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 10,
    page: 0,
  });

  async function handleSaveGroup() {
    handleApiRequest(
      router,
      () => GroupController.update(token, group.id, { cycles: group.cycles }),
      (response) => {
        setGroup(response);
        setCycle(response.cycles[group.cycles.length - 1]);
        toast.success('Group successfully saved');
      },
      undefined,
      'Failed to save group'
    );
  }

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
                backgroundColor: theme.palette.primary.light,
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
                backgroundColor: theme.palette.primary.light,
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
        justifyContent="center"
        mb={3}
      >
        <Button onClick={handleSaveGroup}>Save</Button>

        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          minHeight={195}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        >
          <MultiCycleSlider />
        </Box>

        <CycleComponents
          setEditModal={setShowEditCycleModal}
          setEditCycle={setEditCycle}
        />

        {/* <Typography variant="h6" gutterBottom mt={3}>
          Cycles
        </Typography>

        <Box
          sx={{
            width:
              !screenSize.isMobile &&
              !screenSize.isLandscapeMobile &&
              !screenSize.isTablet
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
                backgroundColor: theme.palette.primary.light,
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
       */}
      </Box>

      {editCycle && (
        <MyModal
          isOpen={showEditCycleModal}
          setIsOpen={(open) => setShowEditCycleModal(open)}
          onCancel={() => setShowEditCycleModal(false)}
          cancelText="Close"
          onConfirm={() => {
            setShowEditCycleModal(false);
            setEditCycle(null);
          }}
        >
          <EditCycleForm
            selectedCycle={editCycle}
            setSelectedCycle={setEditCycle}
          />
        </MyModal>
      )}
    </>
  );
}
