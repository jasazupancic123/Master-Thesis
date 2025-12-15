import { Box, Button, Typography } from '@mui/material';

import { theme } from '@/app/style';
import type { SetState } from '@/lib/common/type/state.type';
import { useCoachTrainingStation } from '@/store/training-station.provider';

interface Props {
  setOpenNewStationModal: SetState<boolean>;
}

export default function TrainingStationHeader(props: Props) {
  const { station } = useCoachTrainingStation();

  const { setOpenNewStationModal } = props;

  if (!station) return null;

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={2}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flex={1}
        gap={2}
      >
        <Typography
          variant="h6"
          textAlign="center"
          sx={{
            color: station.color,
          }}
        >
          {station.name}
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={0.5}
        >
          <Button
            variant="contained"
            onClick={() => setOpenNewStationModal(true)}
            sx={{
              height: 24,
              minWidth: 46,
              backgroundColor: theme.palette.background.dark,
              color: theme.palette.text.primary,
              fontSize: 12,
              p: '0px !important',
            }}
          >
            New
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
