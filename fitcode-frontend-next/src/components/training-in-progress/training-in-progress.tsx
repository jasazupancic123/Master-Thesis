import { Circle } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Fab, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import AthleteOptionsContainer from '../athlete-options-container/athlete-options-container';
import MyModal from '../modal/modal';
import TrainingInProgressSuperset from '../training-in-progress-superset/training-in-progress-superset';
import { getUndoneExercises } from './state';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import { useHorizontalOverflow } from '@/common/util/horizontal-overflow.util';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgress() {
  const theme = useTheme();

  const {
    trainingInProgress,
    setTrainingInProgress,
    setView,
    clearTrainingState,
  } = useTraining();

  const {
    selectedExercise,
    setSelectedExercise,
    selectedSuperset,
    setSelectedSuperset,
    supersetIndex,
    setSetIndex,
  } = useTrainingInProgress();

  const { selectedTrackingMethod } = useAthleteHeader();

  const { outerRef, innerRef, isOverflowing } = useHorizontalOverflow();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [undoneExercises, setUndoneExercises] = useState<TrainingExercise[]>(
    []
  );
  const [showUndoneSetsWarning, setShowUndoneSetsWarning] = useState(false);
  const [showUndoneSetsError, setShowUndoneSetsError] = useState(false);

  useEffect(() => {
    if (!trainingInProgress) return;

    const newTrainingInProgress = { ...trainingInProgress };
    if (!newTrainingInProgress.supersets) {
      newTrainingInProgress.supersets =
        newTrainingInProgress.selectedComponent.supersets;
    }

    if (!newTrainingInProgress.startOfTraining) {
      newTrainingInProgress.startOfTraining = dayjs();
    }

    let selectedSuperset = undefined;
    if (!newTrainingInProgress.supersetIndex) {
      newTrainingInProgress.supersetIndex = 0;
      selectedSuperset = newTrainingInProgress.supersets[0];
    } else {
      selectedSuperset =
        newTrainingInProgress.supersets[
          newTrainingInProgress.supersetIndex || 0
        ];
    }

    setSelectedSuperset(selectedSuperset);

    if (!selectedExercise) {
      setSelectedExercise(selectedSuperset?.exercises[0] || null);
      setSetIndex(0);
    }

    const component = [
      newTrainingInProgress.training.warmup,
      ...newTrainingInProgress.training.components,
      newTrainingInProgress.training.cooldown,
    ].find((c) => c.id === newTrainingInProgress.selectedComponent?.id);

    if (!component) return;

    setTrainingInProgress(
      (prev) =>
        ({
          ...prev,
          selectedComponent: component,
          supersets: component.supersets,
          startOfTraining: newTrainingInProgress.startOfTraining,
          supersetIndex: newTrainingInProgress.supersetIndex,
        }) as TrainingInProgress
    );
  }, [trainingInProgress?.selectedComponent]);

  useEffect(() => {
    if (!trainingInProgress) return;
    if (!trainingInProgress.startOfTraining) {
      setTrainingInProgress(
        (prev) =>
          ({
            ...prev,
            startOfTraining: dayjs(),
          }) as TrainingInProgress
      );
    }

    const startTime = dayjs(trainingInProgress.startOfTraining).valueOf();
    const interval = setInterval(() => {
      const now = dayjs().valueOf();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [trainingInProgress?.startOfTraining]);

  const handleCancelTraining = () => {
    clearTrainingState();
    setView(ExerciseTrainingView.ExerciseView);
    setElapsedTime(0);
    setSelectedSuperset(undefined);
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenMenu = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleCancel = () => {
    handleCloseMenu();
    setOpenCancelTrainingModal(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00:00'; // Default to zero time if invalid
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return trainingInProgress ? (
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
              {trainingInProgress.supersets?.map((superset, i) => (
                <Typography
                  key={i}
                  fontSize={12}
                  textAlign="center"
                  noWrap
                  sx={{
                    flex: '0 0 auto',
                    color:
                      selectedSuperset === superset
                        ? theme.palette.primary.main
                        : undefined,
                    fontWeight:
                      selectedSuperset === superset ? 'bold' : 'normal',
                  }}
                  onClick={() => {
                    const undoneExercises = getUndoneExercises(
                      selectedSuperset,
                      supersetIndex,
                      trainingInProgress.exerciseSetTrackingState
                    );
                    if (undoneExercises.length > 0) {
                      setUndoneExercises(undoneExercises);
                      setShowUndoneSetsWarning(true);
                    }

                    setSelectedSuperset(superset);
                    setSelectedExercise(superset.exercises[0] || null);
                    setSetIndex(0);
                    setTrainingInProgress((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        supersetIndex: i,
                      };
                    });
                  }}
                >
                  {selectedSuperset === superset && (
                    <Circle
                      sx={{
                        fontSize: 8,
                        verticalAlign: 'middle',
                        marginRight: 0.5,
                        mb: 0.2,
                      }}
                    />
                  )}
                  Superset {i + 1}
                </Typography>
              ))}
            </Box>
          </Box>
        </>
      )}

      {trainingInProgress &&
      trainingInProgress.supersets &&
      selectedSuperset ? (
        <TrainingInProgressSuperset
          anchorEl={anchorEl}
          open={open}
          handleCancel={handleCancel}
          handleCancelTraining={handleCancelTraining}
          handleOpenMenu={handleOpenMenu}
          handleCloseMenu={handleCloseMenu}
          setUndoneExercises={setUndoneExercises}
          setShowUndoneSetsError={setShowUndoneSetsError}
        />
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

      <MyModal
        isOpen={openCancelTrainingModal}
        setIsOpen={(open) => setOpenCancelTrainingModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenCancelTrainingModal(false)}
        onConfirm={() => {
          handleCancelTraining();
          setOpenCancelTrainingModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Cancel Training?
        </Typography>
      </MyModal>
      <MyModal
        isOpen={showUndoneSetsWarning}
        setIsOpen={(open) => setShowUndoneSetsWarning(open)}
        onConfirm={() => {
          setShowUndoneSetsWarning(false);
          setUndoneExercises([]);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          {undoneExercises.map((e) => e.exercise?.name).join(', ')} undone in
          current superset
        </Typography>
      </MyModal>
      <MyModal
        isOpen={showUndoneSetsError}
        setIsOpen={(open) => setShowUndoneSetsError(open)}
        onConfirm={() => {
          setShowUndoneSetsError(false);
          setUndoneExercises([]);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          {undoneExercises.map((e) => e.exercise?.name).join(', ')} undone in
          training, complete them before finishing
        </Typography>
      </MyModal>
    </Box>
  ) : null;
}
