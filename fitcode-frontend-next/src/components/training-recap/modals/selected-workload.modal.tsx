import { Avatar, Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';

import {
  getPrescribedCompletedPairs,
  setDetailsColumns,
} from '@/components/report-athlete-exercise/actions/actions-set-details-modal';
import type { Workload } from '@/core/training/type/workload.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import ImageGallery from '@/ui/image-gallery';
import MyModal from '@/ui/modal';

interface Props {
  workload: Workload | null;
}

export default function SelectedWorkloadModal(props: ModalProps & Props) {
  const screenSize = useScreenSize();

  const { users, exercises } = useMain();

  const { open, setOpen, workload } = props;

  if (!workload) return null;

  const user = users.data.find((u) => u.uid === workload.userId)!;
  const exercise = exercises.find((e) => e.id === workload.exerciseId)!;

  if (!user || !exercise) return null;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => setOpen(false)}
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
        <ImageGallery
          imagesL={workload?.photoURLs || []}
          imagesR={[]}
          enableImagePickerSlider
        />
      </Box>
    </MyModal>
  );
}
