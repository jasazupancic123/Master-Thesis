'use client';

import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import {
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Box, Checkbox, Grid2, IconButton, Typography } from '@mui/material';
import { Draggable } from 'react-beautiful-dnd';
import TrainingExerciseCardContainer from '../training-exercise-card-container/training-exercise-card-container';
import { useTheme } from '@mui/material';
import { SetState } from '@/common/type/state.type';

interface SupersetExerciseProps {
  exercise: TrainingExercise;
  superset: Superset;
  i: number;
  k: number;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: SetState<TrainingExercise | null>;
  menuExercise: TrainingExercise | null;
  setMenuExercise: SetState<TrainingExercise | null>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  setOpenVideoPlayerModal: SetState<boolean>;
  setOpenAddExerciseModal: SetState<boolean>;
  handleMenuClose: () => void;
  setSupersets: SetState<Superset[]>;
  setsNumbers: { exerciseId: string; setsNumber: number }[];
  setSetsNumbers: SetState<{ exerciseId: string; setsNumber: number }[]>;
}

export default function SupersetExercise(props: SupersetExerciseProps) {
  const {
    exercise,
    superset,
    i,
    k,
    selectedExercise,
    setSelectedExercise,
    setMenuExercise,
    anchorEl,
    setAnchorEl,
    setOpenVideoPlayerModal,
    setSupersets,
    setsNumbers,
    setSetsNumbers,
  } = props;

  const theme = useTheme();
  const screenSize = useScreenSize();

  const { supersets, selectedExercises, setSelectedExercises } =
    useTrainerDayViewContext();

  const { training, component } = useTrainerDayViewContext();

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
            sx={{
              // px: screenSize.isDesktop || screenSize.isMobile ? 0 : 0.5,
              border: selectedExercises.some((ex) => ex.id === exercise.id)
                ? `1px solid ${theme.palette.primary.main}`
                : undefined,
            }}
          >
            <Box
              id={exercise.id}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              position="relative"
              borderRadius={1}
              boxShadow={snapshot.isDragging && !open ? 2 : 0}
              bgcolor={snapshot.isDragging ? '#f0f0f0' : 'transparent'}
              sx={
                {
                  // px: screenSize.isDesktop || screenSize.isMobile ? 0 : 0.5,
                }
              }
            >
              <Box
                position="absolute"
                top={9.31}
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
                  sx={{
                    zIndex: 1000,
                    pt: 0.5,
                    mt: 0,
                  }}
                  disableRipple
                >
                  <Checkbox
                    size="small"
                    checked={selectedExercises.some(
                      (ex) => ex.id === exercise.id
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedExercises((prev) => [...prev, exercise]);
                      } else {
                        setSelectedExercises((prev) =>
                          prev.filter((ex) => ex.id !== exercise.id)
                        );
                      }
                    }}
                    sx={{
                      transform: 'scale(0.9)',
                      width: 16,
                      height: 16,
                      zIndex: 1000,
                    }}
                  />
                </IconButton>
                {/* <Menu
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
                        setTodaysTrainings,
                        supersets,
                        component,
                        setComponent,
                        selectedSubgroup,
                        setSelectedSubgroup,
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
                    Delete123
                  </Typography>
                </MenuItem>
              </Menu> */}
              </Box>
              <TrainingExerciseCardContainer
                supersetIndex={i}
                exercise={exercise}
                selectedExercise={selectedExercise}
                setSelectedExercise={setSelectedExercise}
                supersets={supersets}
                superior={{
                  row: i === 0,
                  column: k === 0,
                  all: i === 0 && k === 0,
                }}
                setOpenVideoPlayerModal={setOpenVideoPlayerModal}
                setSupersets={setSupersets}
                setsNumbers={setsNumbers}
                setSetsNumbers={setSetsNumbers}
              />
            </Box>
          </Box>
        )}
      </Draggable>
    </Grid2>
  );
}
