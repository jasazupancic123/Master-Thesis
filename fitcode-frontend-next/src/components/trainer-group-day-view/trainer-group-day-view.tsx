import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React from 'react';

import CustomDivider from '../../util/custom-divider/custom-divider';
import VerticalLinesBorders from '../../util/vertical-lines-borders/vertical-lines-borders';
import { MAX_WIDTH } from './constant/dimensions.constant';
import GroupTrainerDayViewTrainings from './group-trainer-day-view-trainings';
import useTrainerDayWeek from './hooks/use-day-week';
import GroupTrainerDayViewHeader from './trainer-group-day-view-header';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

dayjs.extend(weekOfYear);

export default function TrainerDayView() {
  const screenSize = useScreenSize();

  const { cycle } = useGroup();
  const { training } = useTrainerDayView();
  const { week, setDays, days } = useTrainerDayWeek();

  return (
    <Box width="100%" position="relative">
      <Box
        position="relative"
        sx={{
          maxWidth: MAX_WIDTH,
          minHeight: 'calc(100vh - 50px)',
          mx: 'auto',
          overflowY: 'none',
        }}
      >
        <VerticalLinesBorders />

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          sx={{
            borderBottomRightRadius: !training || !cycle ? 0 : 10,
            borderBottomLeftRadius: !training || !cycle ? 0 : 10,
            bgcolor: 'background.default',
          }}
          justifyContent="flex-start"
        >
          {/* Header with day and week selection */}
          <GroupTrainerDayViewHeader
            days={days}
            setDays={setDays}
            week={week}
          />
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          maxWidth={MAX_WIDTH}
          sx={{
            mx: 'auto',
            px: 3,
            mt: screenSize.isMobile || screenSize.isTablet ? 2 : 0,
          }}
        >
          <CustomDivider />
        </Box>

        {/* Trainings for the day */}
        <Box maxWidth={MAX_WIDTH} mx="auto">
          <GroupTrainerDayViewTrainings />
        </Box>
      </Box>
    </Box>
  );
}
