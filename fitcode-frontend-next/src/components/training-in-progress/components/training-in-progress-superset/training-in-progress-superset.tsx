import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Fab, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material';
import { useRef, useState } from 'react';

import { useTrainingInProgressUtils } from '../../context/training-in.progress-utils.provider';
import { useUndoneExercises } from '../../context/undone-exercises.provider';
import TrainingInProgressExerciseCard from '../training-in-progress-exercise-card/training-in-progress-exercise-card';
import { handleFinishSuperset } from './actions/actions-superset';
import NextSupersetModal from './modals/next-superset-modal';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgressSuperset() {
  const theme = useTheme();

  const traininContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();
  const trainingInProgressUtilsContext = useTrainingInProgressUtils();
  const athleteHeaderContext = useAthleteHeader();
  const trainingInProgressUndoneExercisesContext = useUndoneExercises();

  const { trainingInProgress } = traininContext;

  const { selectedTrackingMethod } = athleteHeaderContext;

  const { anchorEl, open, handleCancel, handleOpenMenu, handleCloseMenu } =
    trainingInProgressUtilsContext;

  const { selectedSuperset, selectedExercise } = trainingInProgressContext;

  const [openNextSupersetModal, setOpenNextSupersetModal] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);

  if (!trainingInProgress || !selectedSuperset) return null;

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box
        ref={boxRef}
        width="100%"
        flexGrow={1} // Ensures it expands
        display="flex"
        flexDirection="column"
        gap={3}
      >
        {/* Training Exercise */}
        {selectedExercise && <TrainingInProgressExerciseCard />}
      </Box>

      {selectedTrackingMethod !== TrackingMethod.CAMERA && (
        <Fab
          size="small"
          sx={{
            backgroundColor: theme.palette.primary.main,
            position: 'fixed',
            bottom: 60,
            right: 16,
          }}
          onClick={handleOpenMenu}
        >
          <MoreVertIcon fontSize="small" />
        </Fab>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { mb: 1 },
        }}
      >
        <MenuItem
          onClick={() =>
            handleFinishSuperset({
              useTraining: { ...traininContext, trainingInProgress },
              useTrainingInProgress: trainingInProgressContext,
              useTrainingInProgressUndoneExercises:
                trainingInProgressUndoneExercisesContext,
              useTrainingInProgressUtils: trainingInProgressUtilsContext,
            })
          }
        >
          <>
            <DoneIcon sx={{ marginRight: 1 }} />
            Finish Training
          </>
        </MenuItem>
        <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
          <CloseIcon sx={{ marginRight: 1 }} />
          Cancel Training
        </MenuItem>
      </Menu>

      <NextSupersetModal
        boxRef={boxRef}
        open={openNextSupersetModal}
        setOpen={setOpenNextSupersetModal}
      />
    </Box>
  );
}
