import { Circle } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Fab, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import React, { useEffect } from 'react';

import AthleteOptionsContainer from '../athlete/athlete-options-container';
import { handleChangeSuperset } from './actions/actions-superset';
import { handleInitTrainingInProgressComponent } from './actions/actions-training-in-progress';
import TrainingInProgressSuperset from './components/training-in-progress-superset/training-in-progress-superset';
import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import { useUndoneExercises } from './context/undone-exercises.provider';
import CancelTrainingModal from './modals/cancel-training-modal';
import UndoneSetsErrorModal from './modals/undone-sets-error-modal';
import UndoneSetsWarningModal from './modals/undone-sets-warning-modal';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { preloadPoseLandmarker } from '@/core/pose-detection/util/pose-landmarker-loader.util';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { useHorizontalOverflow } from '@/hooks/use-horizontal-overflow.hook';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgress() {
  const theme = useTheme();

  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();
  const trainingInProgressUndoneExercisesContext = useUndoneExercises();
  const trainingInProgressUtilsContext = useTrainingInProgressUtils();
  const athleteHeaderContext = useAthleteHeader();

  const { trainingInProgress } = trainingContext;

  const { selectedSuperset } = trainingInProgressContext;

  const {
    elapsedTime,
    anchorEl,
    open,
    handleOpenMenu,
    handleCloseMenu,
    handleCancel,
    formatTime,
    openCancelTrainingModal,
    setOpenCancelTrainingModal,
    showUndoneSetsError,
    setShowUndoneSetsError,
    showUndoneSetsWarning,
    setShowUndoneSetsWarning,
  } = trainingInProgressUtilsContext;

  const { selectedTrackingMethod } = athleteHeaderContext;
  const { outerRef, innerRef, isOverflowing } = useHorizontalOverflow();

  /* Preload pose landmarker */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    preloadPoseLandmarker();
  }, []);

  /* Init training in progress for selected component */
  useEffect(() => {
    if (!trainingInProgress) return;

    handleInitTrainingInProgressComponent({
      useTraining: { ...trainingContext, trainingInProgress },
      useTrainingInProgressContext: trainingInProgressContext,
    });
  }, [trainingInProgress?.selectedComponent]);

  if (!trainingInProgress) return null;

  return (
    <Box
      id="training-in-progress-main"
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      {selectedTrackingMethod !== TrackingMethod.CAMERA && (
        <>
          <AthleteOptionsContainer
            items={['', `Time: ${formatTime(elapsedTime)}`]}
            selectedItem={'none'}
            title={trainingInProgress.selectedComponent.id || ''}
            onClick={() => {}}
          />
          <Box
            ref={outerRef}
            width="100%"
            sx={{
              overflowX: 'auto',
              py: 1.5,
              pt: 0.7,
              borderBottom: `1px solid ${theme.palette.primary.main}`,
            }}
          >
            <Box
              ref={innerRef}
              display="flex"
              gap={4}
              p={1}
              justifyContent={isOverflowing ? 'flex-start' : 'center'}
              sx={{
                whiteSpace: 'nowrap',
              }}
            >
              {trainingInProgress.supersets?.map((superset, i) => {
                const isSelected =
                  (trainingInProgress.supersetIndex ?? 0) === i; // <- key change

                return (
                  <Typography
                    key={i}
                    fontSize={12}
                    textAlign="center"
                    noWrap
                    sx={{
                      flex: '0 0 auto',
                      color: isSelected
                        ? theme.palette.primary.main
                        : undefined,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    }}
                    onClick={() => {
                      handleChangeSuperset(
                        { superset, i },
                        {
                          useTraining: {
                            ...trainingContext,
                            trainingInProgress,
                          },
                          useTrainingInProgress: trainingInProgressContext,
                          useUndoneExercises:
                            trainingInProgressUndoneExercisesContext,
                          useTrainingInProgressUtils:
                            trainingInProgressUtilsContext,
                        }
                      );
                    }}
                  >
                    {isSelected && (
                      <Circle
                        sx={{
                          fontSize: 8,
                          verticalAlign: 'middle',
                          mr: 0.5,
                          mb: 0.2,
                        }}
                      />
                    )}
                    Superset {i + 1}
                  </Typography>
                );
              })}
            </Box>
          </Box>
        </>
      )}

      {trainingInProgress &&
      trainingInProgress.supersets &&
      selectedSuperset ? (
        <TrainingInProgressSuperset />
      ) : (
        <Box
          display="flex"
          width="100vw"
          height="100vh"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h6">No exercises</Typography>
          <Fab
            sx={{
              backgroundColor: theme.palette.primary.main,
              position: 'absolute',
              bottom: 60,
              left: 16,
            }}
            onClick={handleOpenMenu}
          >
            <MoreVertIcon />
          </Fab>
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
              sx: { mb: 1 }, // Adds a small margin between the FAB and menu
            }}
          >
            <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
              <CloseIcon sx={{ marginRight: 1 }} />
              Cancel Training
            </MenuItem>
          </Menu>
        </Box>
      )}

      <CancelTrainingModal
        open={openCancelTrainingModal}
        setOpen={setOpenCancelTrainingModal}
      />

      <UndoneSetsWarningModal
        open={showUndoneSetsWarning}
        setOpen={setShowUndoneSetsWarning}
      />

      <UndoneSetsErrorModal
        open={showUndoneSetsError}
        setOpen={setShowUndoneSetsError}
      />
    </Box>
  );
}
