import { Avatar, Box, Tooltip as MuiTooltip, Typography } from '@mui/material';

import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import useSelectedMemberWeight from './hooks/use-weight';
import { deselectAthlete } from './actions/actions-selected-athlete';

export default function SelectedMemberReport() {
  const screenSize = useScreenSize();

  const trainerDayViewContext = useTrainerDayViewContext();

  const { selectedAthlete } = trainerDayViewContext;

  const { users } = useMain();

  const { weight } = useSelectedMemberWeight();

  if (!selectedAthlete) return null;

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      position="relative"
      gap={1}
      my={screenSize.isMobile ? 1 : 0}
      flexDirection={screenSize.isMobile ? 'column' : 'row'}
    >
      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        display="flex"
      ></Box>
      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={0.5}
      >
        <MuiTooltip
          title={selectedAthlete.email}
          sx={{
            zIndex: 10,
          }}
        >
          <Box position="relative" display="inline-block">
            <Avatar
              className="avatar-border"
              src={
                users.find((m) => m.uid === selectedAthlete.uid)?.photoURL ||
                '/user_avatar.png'
              }
              sx={{
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                filter: 'grayscale(100%)',
                zIndex: 10,
              }}
              onClick={() =>
                deselectAthlete({
                  useTrainerDayViewContext: trainerDayViewContext,
                })
              }
            />
          </Box>
        </MuiTooltip>
        <Typography fontSize={16} textAlign="center">
          Attendance: 79%
        </Typography>
        <Typography
          fontSize={16}
        >{`Weight: ${weight !== undefined ? weight.toString() + 'kg' : 'N/A'}`}</Typography>
        <Typography fontSize={16} textAlign="center">
          Height: 198 cm
        </Typography>
      </Box>
      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        textAlign="center"
      ></Box>
    </Box>
  );
}
