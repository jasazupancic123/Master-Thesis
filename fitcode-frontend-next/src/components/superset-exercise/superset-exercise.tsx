'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

import ExerciseMembersInProgress from '../training-exercise-card/exercise-members-in-progress';
import TrainingExerciseCardContainer from '../training-exercise-card-container/training-exercise-card-container';
import { deleteSupersetExercise } from './state';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

interface SupersetExerciseProps {
  exercise: TrainingExercise;
  superset: Superset;
  supersetIndex: number;
  exerciseIndex: number;
}

export default function SupersetExercise(props: SupersetExerciseProps) {
  const { exercise, superset, supersetIndex, exerciseIndex } = props;

  const theme = useTheme();
  const screenSize = useScreenSize();

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
    selectedAthlete,
  } = useTrainerDayViewContext();

  const { setTrainings } = useGroup();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);

  const disabledDrag = !!(selectedExercise?.id === exercise.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    disabled: disabledDrag,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    borderRadius: 4,
    boxShadow: isDragging && !open ? '0 2px 8px rgba(0,0,0,0.2)' : undefined,
    background: isDragging ? '#f0f0f0' : 'transparent',
    zIndex: isDragging ? 1000 : 'auto',
    // Hide the original while dragging so the overlay represents the item
    opacity: isDragging ? 0 : 1,
    touchAction: 'none' /* critical for mobile dragging */,
    userSelect: 'none',
    willChange: 'transform',
  };

  if (!component || !training) return null;

  const isCircuit = (selectedSubgroup || component).mainSet === MainSet.CIRCUIT;

  const numExercises = (selectedSubgroup || component).supersets.flatMap(
    (s) => s.exercises
  ).length;

  return (
    <Grid2
      size={
        (selectedSubgroup || component).mainSet === MainSet.CIRCUIT
          ? screenSize.isSmallerThanLaptop
            ? 12
            : numExercises === 1
              ? 12
              : numExercises === 2
                ? 6
                : numExercises === 3
                  ? 4
                  : 3
          : screenSize.isSmallerThanLaptop
            ? 12
            : { xs: 12 }
      }
      key={exercise.id}
      sx={{
        mb:
          (selectedSubgroup || component).mainSet === MainSet.CIRCUIT
            ? 0
            : superset.exercises.length - 1 !== exerciseIndex
              ? 0.4
              : undefined,
      }}
    >
      <Box
        sx={
          selectedExercises.some((ex) => ex.id === exercise.id)
            ? { position: 'relative' }
            : {}
        }
      >
        <Box
          id={exercise.id}
          ref={setNodeRef}
          {...attributes}
          {...(!disabledDrag ? listeners : {})}
          position="relative"
          sx={style}
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
            sx={{ cursor: 'pointer' }}
          >
            <Typography
              variant="caption"
              color={theme.palette.background.lightBorder}
              sx={{ zIndex: 1 }}
            >
              {isCircuit
                ? `${exerciseIndex + 1}`
                : `${supersetIndex + 1}${String.fromCharCode(65 + exerciseIndex)}`}
            </Typography>
          </Box>
          {selectedExercise?.id !== exercise.id && (
            <Box
              position="absolute"
              top={7.1}
              right={expandedExercisesView ? 22 : 10}
              sx={{ zIndex: 1 }}
            >
              <ExerciseMembersInProgress
                trainingMembersLength={training.membersIds.length}
                componentId={component.id}
                supersetIndex={supersetIndex}
                exerciseId={exercise.id}
              />
            </Box>
          )}

          {!selectedAthlete && expandedExercisesView && (
            <Box
              position="absolute"
              top={2}
              right={0}
              display={selectedExercise?.id === exercise.id ? 'none' : 'flex'}
              flexDirection="column"
              zIndex={1}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  handleMenuClick(e);
                  setMenuExercise(exercise);
                }}
                sx={{ zIndex: 1000, pt: 0.5, mt: 0 }}
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
