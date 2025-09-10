import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Fab, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useRef, useState } from 'react';

import MyModal from '../modal/modal';
import TrainingInProgressExerciseCard from '../training-in-progress-exercise-card/training-in-progress-exercise-card';
import type { SetState } from '@/common/type/state.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

interface TrainingInProgressSupersetProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  setOpenFinishTrainingModal: SetState<boolean>;
  handleCancel: () => void;
  handleOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
}

export default function TrainingInProgressSuperset(
  props: TrainingInProgressSupersetProps
) {
  const theme = useTheme();

  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const {
    anchorEl,
    open,
    setOpenFinishTrainingModal,
    handleCancel,
    handleOpenMenu,
    handleCloseMenu,
  } = props;

  const { selectedSuperset, setSelectedSuperset, selectedExercise } =
    useTrainingInProgress();

  const [openNextSupersetModal, setOpenNextSupersetModal] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const handleFinish = () => {
    if (!trainingInProgress?.supersets || !selectedSuperset) return;
    handleCloseMenu();

    setOpenFinishTrainingModal(true);
  };

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
        sx={{
          overflowY: 'auto',
          height: 'calc(100vh - 150px)',
          minHeight: 0,
        }}
      >
        {/* Training Exercise */}
        {selectedExercise && <TrainingInProgressExerciseCard />}
      </Box>

      <Fab
        size="small"
        sx={{
          backgroundColor: theme.palette.primary.main,
          position: 'absolute',
          bottom: 60,
          right: 16,
        }}
        onClick={handleOpenMenu}
      >
        <MoreVertIcon fontSize="small" />
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
          sx: { mb: 1 },
        }}
      >
        <MenuItem onClick={handleFinish}>
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
      <MyModal
        isOpen={openNextSupersetModal}
        setIsOpen={(open) => setOpenNextSupersetModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenNextSupersetModal(false)}
        onConfirm={() => {
          setSelectedSuperset(
            trainingInProgress.supersets[
              trainingInProgress.supersets.indexOf(selectedSuperset) + 1
            ]
          );
          if (!trainingInProgress.supersetIndex) {
            setTrainingInProgress(
              (prev) =>
                ({
                  ...prev,
                  supersetIndex: 1,
                }) as TrainingInProgress
            );
          } else {
            setTrainingInProgress((prev: TrainingInProgress | null) => {
              if (!prev) return null;
              return {
                ...prev,
                supersetIndex: prev.supersetIndex + 1,
              } as TrainingInProgress;
            });
          }
          setOpenNextSupersetModal(false);
          if (boxRef.current) {
            boxRef.current.scrollTop = 0;
          }
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Move to next superset?
        </Typography>
      </MyModal>
    </Box>
  );
}
