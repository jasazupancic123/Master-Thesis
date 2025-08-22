'use client';

import { MoreVert } from '@mui/icons-material';
import {
  Box,
  Grid2,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';

import TrainingExerciseCardContainer from '../training-exercise-card-container/training-exercise-card-container';
import deleteSupersetExercise from './state';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';
import { useSupersets } from '@/store/supersets-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface SupersetExerciseProps {
  exercise: TrainingExercise;
  superset: Superset;
  supersetIndex: number;
  exerciseIndex: number;
}

export default function SupersetExercise(props: SupersetExerciseProps) {
  const { exercise, superset, supersetIndex, exerciseIndex } = props;

  const theme = useTheme();

  const {
    selectedExercise,
    setSelectedExercise,
    setMenuExercise,
    expandedExercisesView,
    setOpenVideoPlayerModal,
  } = useSupersets();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedExercises,
    setSelectedExercises,
    supersets,
    setSupersets,
  } = useTrainerDayViewContext();

  const { setTrainings } = useGroup();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);

  if (!component || !training) return null;

  return (
    <Grid2
      size={{ xs: 12 }}
      key={exercise.id}
      sx={{
        mb: superset.exercises.length - 1 !== exerciseIndex ? 0.4 : undefined,
      }}
    >
      <Draggable
        key={exercise.id}
        draggableId={exercise.id.toString()}
        index={exerciseIndex}
        isDragDisabled={!!(selectedExercise?.id === exercise.id)} // Disable dragging
      >
        {(provided, snapshot) => (
          <Box
            sx={
              selectedExercises.some((ex) => ex.id === exercise.id)
                ? {
                    position: 'relative',
                  }
                : // ? {
                  //     position: 'relative',
                  //     '&::after': {
                  //       content: '""',
                  //       position: 'absolute',
                  //       inset: 0,
                  //       border: `1px solid ${theme.palette.primary.main}`,
                  //       borderRadius: 0,
                  //       pointerEvents: 'none',
                  //     },
                  //   }
                  {}
            }
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
                top={7.1}
                left={10}
                display="flex"
                flexDirection="column"
                onClick={() => {
                  if (selectedExercise?.id === exercise.id)
                    setSelectedExercise(null);
                  else setSelectedExercise(exercise);
                }}
                sx={{
                  cursor: 'pointer',
                }}
              >
                <Typography
                  variant="caption"
                  color={theme.palette.background.lightBorder}
                  sx={{ zIndex: 1 }}
                >
                  {`${supersetIndex + 1}${String.fromCharCode(65 + exerciseIndex)}`}
                </Typography>
              </Box>

              {expandedExercisesView && (
                <Box
                  position="absolute"
                  top={5}
                  right={0}
                  display={
                    selectedExercise?.id === exercise.id ? 'none' : 'flex'
                  }
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
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <TrainingExerciseCardContainer
                supersetIndex={supersetIndex}
                exercise={exercise}
                superior={{
                  row: supersetIndex === 0,
                  column: exerciseIndex === 0,
                  all: supersetIndex === 0 && exerciseIndex === 0,
                }}
              />
            </Box>
          </Box>
        )}
      </Draggable>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => {
          setAnchorEl(null);
        }}
      >
        <MenuItem
          onClick={() => {
            deleteSupersetExercise({
              supersetIndex,
              exerciseIndex,
              exercise,
              selectedSubgroup,
              setSelectedSubgroup,
              component,
              setComponent,
              training,
              setTraining,
              setTrainings,
              setAnchorEl,
              setSelectedExercises,
            });
          }}
        >
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: theme.palette.error.main,
            }}
          >
            Remove
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenVideoPlayerModal(true);
            setAnchorEl(null);
          }}
        >
          <Typography>Show Video</Typography>
        </MenuItem>
      </Menu>
    </Grid2>
  );
}
