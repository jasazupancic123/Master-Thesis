import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Fab, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import Animation from '../animation/animation';
import AthleteOptionsContainer from '../athlete-options-container/athlete-options-container';
import MyModal from '../modal/modal';
import TrainingInProgressSuperset from '../training-in-progress-superset/training-in-progress-superset';
import { getUndoneExercises, handleFinishTraining } from './state';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import type { SetState } from '@/common/type/state.type';
import { useHorizontalOverflow } from '@/common/util/horizontal-overflow.util';
import { TrainingController } from '@/controller/training/training.controller';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

interface TrainingInProgressProps {
  setTrainings: SetState<Training[]>;
}

export default function TrainingInProgress(props: TrainingInProgressProps) {
  const theme = useTheme();
  const router = useRouter();
  const { exercises } = useMain();
  const { user, token } = useAuthenticatedAuth();
  const controller = TrainingController.getInstance(token);

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
  const { setTrainings } = props;

  const [elapsedTime, setElapsedTime] = useState(0);
  const [openFinishTrainingModal, setOpenFinishTrainingModal] = useState(false);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(true);
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

  return playAnimation ? (
    <Animation
      text="LOADING YOUR TRAINING"
      onEnd={() => {
        setPlayAnimation(false);
        setView(ExerciseTrainingView.TrainingView);
      }}
      fullScreen={true}
    />
  ) : trainingInProgress ? (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      {selectedTrackingMethod !== TrackingMethod.CAMERA && (
        <>
          <AthleteOptionsContainer
            items={[
              trainingInProgress.selectedComponent.id,
              `Time: ${formatTime(elapsedTime)}`,
            ]}
            selectedItem={trainingInProgress.selectedComponent.id}
            title="Session"
            onClick={() => {}}
          />
          <Box
            ref={outerRef}
            width="100%"
            sx={{
              overflowX: 'auto',
              border: `1px solid ${theme.palette.background.textBackground}`,
              borderLeft: 'none',
              borderRight: 'none',
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
                        ? theme.palette.text.primary
                        : theme.palette.grey[700],
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
          setOpenFinishTrainingModal={setOpenFinishTrainingModal}
          handleCancel={handleCancel}
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
            <MenuItem
              onClick={() =>
                handleFinishTraining(controller, {
                  trainingInProgress,
                  setTrainingInProgress,
                  user,
                  router,
                  setTrainings,
                  clearTrainingState,
                  setSelectedSuperset,
                  setView,
                  exercises,
                })
              }
            >
              <DoneIcon sx={{ marginRight: 1 }} />
              Finish Training
            </MenuItem>
            <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
              <CloseIcon sx={{ marginRight: 1 }} />
              Cancel Training
            </MenuItem>
          </Menu>
        </Box>
      )}
      <MyModal
        isOpen={openFinishTrainingModal}
        setIsOpen={(open) => setOpenFinishTrainingModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenFinishTrainingModal(false)}
        onConfirm={() => {
          handleFinishTraining(controller, {
            trainingInProgress,
            setTrainingInProgress,
            user,
            router,
            setTrainings,
            clearTrainingState,
            setSelectedSuperset,
            setView,
            exercises,
          });
          setOpenFinishTrainingModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Finish Training?
        </Typography>
      </MyModal>
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
