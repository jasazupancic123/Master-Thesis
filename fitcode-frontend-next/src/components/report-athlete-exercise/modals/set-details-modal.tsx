import { Avatar, Box, Tab, Tabs, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import {
  getPrescribedCompletedPairs,
  setDetailsColumns,
} from '../actions/actions-set-details-modal';
import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import ImageGallery from '@/ui/image-gallery';
import MyModal from '@/ui/modal';

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
  const user = users.data.find((u) => u.uid === workload?.userId);

  if (!exercise || !user || !workload) return null;

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
          rows={getPrescribedCompletedPairs(workload)}
          columns={setDetailsColumns}
          getRowId={(row) => row.name}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[25]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 25 } },
          }}
          sx={{
            width: '100%',
          }}
        />

        {/* Gallery */}
        <ImageGallery
          imagesL={workload?.photoURLs || []}
          imagesR={[]}
          enableImagePickerSlider
        />
      </Box>
    </MyModal>
  );
}
