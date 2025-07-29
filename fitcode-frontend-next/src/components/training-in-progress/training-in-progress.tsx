import { SetState } from '@/common/type/state.type';
import { useAuth } from '@/store/auth-provider';
import { useTraining } from '@/store/training-provider';
import { Superset } from '@/controller/training/type/superset.type';
import { Training } from '@/controller/training/type/training.type';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import { Box, Fab, Typography, Menu, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Animation from '../animation/animation';
import MyModal from '../modal/modal';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import { handleFinishTraining } from './state';
import TrainingInProgressSuperset from '../training-in-progress-superset/training-in-progress-superset';
import { useMain } from '@/store/main-provider';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';

interface TrainingInProgressProps {
  setTrainings: SetState<Training[]>;
}

export default function TrainingInProgress(props: TrainingInProgressProps) {
  const theme = useTheme();
  const router = useRouter();

  const { profile } = useMain();

  const {
    clearTrainingState,
    trainingInProgress,
    setTrainingInProgress,
    setView,
  } = useTraining();

  const { setTrainings } = props;

  const [selectedSuperset, setSelectedSuperset] = useState<
    Superset | undefined
  >();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [openFinishTrainingModal, setOpenFinishTrainingModal] = useState(false);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(true);

  const { user } = useAuth();

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

    if (!newTrainingInProgress.supersetIndex) {
      newTrainingInProgress.supersetIndex = 0;
      setSelectedSuperset(newTrainingInProgress.supersets[0]);
    } else
      setSelectedSuperset(
        newTrainingInProgress.supersets[
          newTrainingInProgress.supersetIndex || 0
        ]
      );

    const componentIndex = newTrainingInProgress.training.components.findIndex(
      (c) => c.id === newTrainingInProgress.selectedComponent?.id
    );

    if (componentIndex === -1) return;
    const component = newTrainingInProgress.training.components[componentIndex];

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

  return playAnimation ? (
    <Animation
      text="LOADING YOUR TRAINING"
      onEnd={() => {
        setPlayAnimation(false);
        setView(ExerciseTrainingView.TrainingView);
      }}
      fullScreen={true}
    />
  ) : (
    <>
      {trainingInProgress &&
      trainingInProgress.supersets &&
      selectedSuperset ? (
        <TrainingInProgressSuperset
          selectedSuperset={selectedSuperset}
          setSelectedSuperset={setSelectedSuperset}
          elapsedTime={elapsedTime}
          anchorEl={anchorEl}
          open={open}
          setOpenFinishTrainingModal={setOpenFinishTrainingModal}
          handleCancel={handleCancel}
          handleOpenMenu={handleOpenMenu}
          handleCloseMenu={handleCloseMenu}
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
                handleFinishTraining({
                  trainingInProgress,
                  setTrainingInProgress,
                  user,
                  router,
                  setTrainings,
                  clearTrainingState,
                  setSelectedSuperset,
                  setView,
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
          handleFinishTraining({
            trainingInProgress,
            setTrainingInProgress,
            user,
            router,
            setTrainings,
            clearTrainingState,
            setSelectedSuperset,
            setView,
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
    </>
  );
}
