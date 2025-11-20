import { Avatar, Box, Tab, Tabs, Typography } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import DataGridCellPercentageDiff from '@/ui/data-grid-cell-percentage-diff';
import ImageGallery from '@/ui/image-gallery';
import MyModal from '@/ui/modal';

type DataGridWorkloadDetailsRow = {
  name: string;
  prescribed: number | undefined;
  completed: number | undefined;
  int?: boolean;
};

interface Props {
  workloads: Workload[];
  setWorkloads: SetState<Workload[]>;
  activeSetNumber: number | null;
  setActiveSetNumber: SetState<number | null>;
}

export default function SetDetailsModal(props: Props & ModalProps) {
  const screenSize = useScreenSize();

  const { users, exercises } = useMain();

  const {
    workloads,
    setWorkloads,
    activeSetNumber,
    setActiveSetNumber,
    open,
    setOpen,
  } = props;

  const [tab, setTab] = useState<number>(
    activeSetNumber !== null ? activeSetNumber : 1
  );
  const foundWorkload = workloads.find((w) => w.setNumber === activeSetNumber);

  const [workload, setWorkload] = useState<Workload | undefined>(
    foundWorkload ? foundWorkload : workloads[0]
  );

  useEffect(() => {
    if (activeSetNumber === null) return;

    const foundWorkload = workloads.find(
      (w) => w.setNumber === activeSetNumber
    );

    if (foundWorkload) {
      setWorkload(foundWorkload);
      setTab(activeSetNumber);
    }
  }, [activeSetNumber]);

  const exercise = exercises.find((ex) => ex.id === workload?.exerciseId);
  const user = users.find((u) => u.uid === workload?.userId);

  if (!exercise || !user || !workload) return null;

  const prescribedCompletedPairs: DataGridWorkloadDetailsRow[] = [
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
      completed: workload.tempoCon,
    },
    {
      name: 'Tempo Con R',
      prescribed: workload.prescribed.tempoConR,
      completed: workload.tempoConR,
    },
    {
      name: 'Tempo Ecc',
      prescribed: workload.prescribed.tempoEcc,
      completed: workload.tempoEcc,
    },
    {
      name: 'Tempo Ecc R',
      prescribed: workload.prescribed.tempoEccR,
      completed: workload.tempoEccR,
    },
    {
      name: 'Tempo Iso',
      prescribed: workload.prescribed.tempoIso,
      completed: workload.tempoIso,
    },
    {
      name: 'Tempo Iso R',
      prescribed: workload.prescribed.tempoIsoR,
      completed: workload.tempoIsoR,
    },
    {
      name: 'Tempo Idle',
      prescribed: workload.prescribed.tempoIdle,
      completed: workload.tempoIdle,
    },
    {
      name: 'Tempo Idle R',
      prescribed: workload.prescribed.tempoIdleR,
      completed: workload.tempoIdleR,
    },
  ].filter(
    (pair) => pair.prescribed !== undefined || pair.completed !== undefined
  );

  const columns: GridColDef[] = [
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
        value === undefined || value === null ? '-' : `${value?.toFixed(2)}%`,
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

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      onCancel={() => {
        setActiveSetNumber(null);
        setWorkloads([]);
        setOpen(false);
      }}
      cancelText="Close"
    >
      <Box
        id="set-details-modal"
        width="100%"
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        gap={2}
        minWidth={screenSize.isMobile ? undefined : 500}
      >
        {/* Header */}
        <Box
          width="100%"
          display="flex"
          justifyContent="flex-start"
          alignItems="center"
          gap={1}
        >
          <Avatar
            src={user.photoURL || USER_AVATAR_IMG_URL}
            sx={{
              width: 54,
              height: 54,
              borderRadius: '50%',
            }}
          />
          <Box
            height={40}
            display="flex"
            flexDirection="column"
            justifyContent="space-around"
            alignItems="flex-start"
          >
            <Typography
              fontWeight={600}
              fontSize={16}
              lineHeight={1}
              textAlign="center"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {user.displayName || 'Unknown User'},{' '}
              {dayjs(workload.from).format('MMM DD A')}
            </Typography>
            <Typography
              fontSize={14}
              lineHeight={1}
              textAlign="center"
              sx={{
                userSelect: 'none',
              }}
            >
              {exercise.name} - Set {workload.setNumber}
            </Typography>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, newValue) => {
            const workload = workloads.find((w) => w.setNumber === newValue);

            if (!workload) return;

            setWorkload(workload);
            setTab(newValue);
          }}
          textColor="primary"
          indicatorColor="primary"
        >
          {workloads.map((t) => (
            <Tab
              key={t.id}
              value={t.setNumber}
              label={`Set ${t.setNumber}`}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.primary,
              }}
            />
          ))}
        </Tabs>

        <DataGrid
          autoHeight
          rows={prescribedCompletedPairs}
          columns={columns}
          getRowId={(row) => row.name}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[25]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 25 } },
          }}
        />

        {/* Gallery */}
        <ImageGallery
          imagesL={workload?.photoURLs || []}
          imagesR={[]}
          enableImagePickerSlider
          imagePickerToBottom
        />
      </Box>
    </MyModal>
  );
}
