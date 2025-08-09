import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Fab, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useRef, useState } from 'react';

import MyModal from '../modal/modal';
import TrainingInProgressExercises from '../training-in-progress-exercises/training-in-progress-exercises';
import type { SetState } from '@/common/type/state.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';

interface TrainingInProgressSupersetProps {
  selectedSuperset: Superset;
  setSelectedSuperset: SetState<Superset | undefined>;
  elapsedTime: number;
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
  const screenSize = useScreenSize();

  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const {
    selectedSuperset,
    setSelectedSuperset,
    elapsedTime,
    anchorEl,
    open,
    setOpenFinishTrainingModal,
    handleCancel,
    handleOpenMenu,
    handleCloseMenu,
  } = props;

  const [openNextSupersetModal, setOpenNextSupersetModal] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const handleContinue = () => {
    if (!trainingInProgress?.supersets || !selectedSuperset) return;
    handleCloseMenu();
    if (
      trainingInProgress?.supersets.indexOf(selectedSuperset) ===
      trainingInProgress?.supersets.length - 1
    ) {
      setOpenFinishTrainingModal(true);
    } else {
      setOpenNextSupersetModal(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00:00'; // Default to zero time if invalid
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!trainingInProgress) return null;

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        sx={{ backgroundColor: 'background.paper' }}
        py={2}
        px={1.5}
      >
        <Typography
          variant="body1"
          fontSize={screenSize.isUltraSmall ? 13 : undefined}
        >
          Superset {trainingInProgress.supersets.indexOf(selectedSuperset) + 1}
        </Typography>
        <Typography
          color={theme.palette.primary.main}
          variant="h6"
          sx={{
            textAlign: 'center',
            marginX: 'auto',
            textTransform: 'uppercase',
          }}
        >
          {trainingInProgress.selectedComponent.id}
        </Typography>
        <Typography
          variant="body1"
          fontSize={screenSize.isUltraSmall ? 13 : undefined}
        >
          {formatTime(elapsedTime)}
        </Typography>
      </Box>
      <Box
        ref={boxRef}
        pt={1.5}
        width="100%"
        flexGrow={1} // Ensures it expands
        display="flex"
        flexDirection="column"
        gap={3}
        sx={{
          overflowY: 'auto', // Allow full scroll
          height: 'calc(100vh - 150px)', // Adjust as needed
          minHeight: 0, // Ensures it doesn't restrict child elements
        }}
      >
        <TrainingInProgressExercises
          selectedSuperset={selectedSuperset}
          setSelectedSuperset={setSelectedSuperset}
        />
      </Box>

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
        <MenuItem onClick={handleContinue}>
          {trainingInProgress.supersets.indexOf(selectedSuperset) ===
          trainingInProgress.supersets.length - 1 ? (
            <>
              <DoneIcon sx={{ marginRight: 1 }} />
              Finish Training
            </>
          ) : (
            <>
              <ArrowForwardIcon sx={{ marginRight: 1 }} />
              Next Superset
            </>
          )}
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
            boxRef.current.scrollTop = 0; // Scroll to the top
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
