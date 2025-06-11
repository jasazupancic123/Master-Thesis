'use client';

import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import {
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Grid2,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { Draggable } from 'react-beautiful-dnd';
import { handleDeleteExercise } from '../trainer-day-view/state';
import TrainingExerciseCardContainer from '../training-exercise-card-container/training-exercise-card-container';
import { useTheme } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { SetState } from '@/common/type/state.type';

interface SupersetExerciseProps {
  exercise: TrainingExercise;
  superset: Superset;
  i: number;
  k: number;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: SetState<TrainingExercise | null>;
  supersetsWithAdd: Superset[];
  setSupersetsWithAdd: SetState<Superset[]>;
  menuExercise: TrainingExercise | null;
  setMenuExercise: SetState<TrainingExercise | null>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  setOpenVideoPlayerModal: SetState<boolean>;
  setOpenAddExerciseModal: SetState<boolean>;
  handleMenuClose: () => void;
}

export default function SupersetExercise(props: SupersetExerciseProps) {
  const {
    exercise,
    superset,
    i,
    k,
    selectedExercise,
    setSelectedExercise,
    supersetsWithAdd,
    setSupersetsWithAdd,
    menuExercise,
    setMenuExercise,
    anchorEl,
    setAnchorEl,
    setOpenVideoPlayerModal,
    handleMenuClose,
  } = props;

  const theme = useTheme();
  const screenSize = useScreenSize();

  const { filteredTrainings, setFilteredTrainings, setDetectedChanges } =
    useGroup();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
  } = useTrainerDayViewContext();

  const handleMenuClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);

  if (!component || !training) return null;

  return (
    <Grid2
      size={{ xs: 12 }}
      key={exercise.id}
      sx={{
        mb: superset.exercises.length - 1 !== k ? 0.4 : undefined,
      }}
    >
      <Draggable
        key={exercise.id}
        draggableId={exercise.id.toString()}
        index={k}
        isDragDisabled={!!(selectedExercise?.id === exercise.id)} // Disable dragging
      >
        {(provided, snapshot) => (
          <Box
            id={exercise.id}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            position="relative"
            borderRadius={1}
            boxShadow={snapshot.isDragging && !open ? 2 : 0}
            bgcolor={snapshot.isDragging ? '#f0f0f0' : 'transparent'}
            sx={{
              px: screenSize.isDesktop || screenSize.isMobile ? 0 : 0.5,
            }}
          >
            <Box
              position="absolute"
              top={10}
              left={10}
              display="flex"
              flexDirection="column"
              onClick={() => {
                if (selectedExercise) setSelectedExercise(null);
                else setSelectedExercise(exercise);
              }}
              sx={{
                cursor: 'pointer',
              }}
            >
              <Typography
                variant="caption"
                color={theme.palette.background.dark}
                sx={{ zIndex: 1 }}
              >
                {`${i + 1}${String.fromCharCode(65 + k)}`}
              </Typography>
            </Box>
            <Box
              position="absolute"
              top={5}
              right={screenSize.isLandscapeMobile ? 0 : 10}
              display={selectedExercise?.id === exercise.id ? 'none' : 'flex'}
              flexDirection="column"
              zIndex={1}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  handleMenuClick(e);
                  setMenuExercise(exercise); // Save the correct exercise here
                }}
              >
                <MoreVert
                  sx={{
                    width: 16,
                    height: 16,
                    transform: 'rotate(90deg)',
                  }}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{
                  '& .MuiPaper-root': {
                    boxShadow: '10px 10px 10px rgba(0, 0, 0, 0.1)', // Disables shadow for the Menu's Paper component
                  },
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem
                  onClick={() => {
                    if (!menuExercise) return;
                    handleDeleteExercise(
                      { exerciseId: menuExercise.id },
                      {
                        training,
                        setTraining,
                        component,
                        setComponent,
                        selectedSubgroup,
                        setSelectedSubgroup,
                        supersetsWithAdd,
                        setSupersetsWithAdd,
                        filteredTrainings,
                        setFilteredTrainings,
                        setDetectedChanges,
                      }
                    );
                    handleMenuClose();
                  }}
                  sx={{
                    textAlign: 'center !important',
                  }}
                >
                  <Typography
                    width="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <DeleteIcon sx={{ mr: 0.5 }} />
                    Delete
                  </Typography>
                </MenuItem>
              </Menu>
            </Box>
            <TrainingExerciseCardContainer
              supersetIndex={i}
              exercise={exercise}
              selectedExercise={selectedExercise}
              setSelectedExercise={setSelectedExercise}
              supersets={supersetsWithAdd}
              setSupersetsWithAdd={setSupersetsWithAdd}
              superior={{
                row: i === 0,
                column: k === 0,
                all: i === 0 && k === 0,
              }}
              setOpenVideoPlayerModal={setOpenVideoPlayerModal}
            />
          </Box>
        )}
      </Draggable>
    </Grid2>
  );
}
