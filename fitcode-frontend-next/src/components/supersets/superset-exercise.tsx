'use client';

import { InfoOutlined, MoreVert } from '@mui/icons-material';
import {
  Box,
  Grid2,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';

import useSupersetExerciseMenu from './hooks/use-menu';
import useSupersetExerciseSortable from './hooks/use-sortable';
import TrainingExerciseCardContainer from '@/components/training-exercise-card/container';
import ExerciseMembersInProgress from '@/components/training-exercise-card/exercise-members-in-progress';
import { core } from '@/core/core.service';
import { MainSet } from '@/core/training/enum/main-set.enum';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

interface Props {
  exercise: TrainingExercise;
  superset: Superset;
  supersetIndex: number;
  exerciseIndex: number;
}

export default function SupersetExercise({
  exercise,
  superset,
  supersetIndex,
  exerciseIndex,
}: Props) {
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
    component,
    selectedExerciseIds,
    selectedAthlete,
    deleteSupersetExercise,
  } = useTrainerDayView();

  const { attributes, listeners, setNodeRef, disabledDrag, style } =
    useSupersetExerciseSortable(exercise);

  const { anchorEl, setAnchorEl, handleMenuClick, open } =
    useSupersetExerciseMenu();

  if (!component || !training) return null;

  const isCircuit = superset.mainSet === MainSet.CIRCUIT;

  return (
    <Grid2
      size={
        isCircuit
          ? screenSize.isDesktop
            ? 3
            : screenSize.isSmallerThanLaptop
              ? 12
              : 4
          : screenSize.isSmallerThanLaptop
            ? 12
            : { xs: 12 }
      }
      key={exercise.id}
      sx={{
        mb: isCircuit
          ? 0
          : superset.exercises.length - 1 !== exerciseIndex
            ? 0.4
            : undefined,
      }}
    >
      <Box
        sx={
          selectedExerciseIds.some((ex) => ex === exercise.id)
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
                sx={{ zIndex: 1000, pt: 0.5, mt: 0 }}
                disableRipple
                onClick={(e) => {
                  handleMenuClick(e);
                  setMenuExercise(exercise);
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
          )}

          {core.training.exercise.getMethod(exercise) && (
            <Box position="absolute" bottom={2} right={2} zIndex={100000}>
              <Tooltip
                title={core.training.exercise.getMethodTooltip(exercise)}
              >
                <IconButton size="small">
                  <InfoOutlined sx={{ height: 12, width: 12 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          <TrainingExerciseCardContainer
            supersetIndex={supersetIndex}
            exercise={exercise}
          />
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            deleteSupersetExercise(exercise.id, supersetIndex, exerciseIndex);
            setAnchorEl(null);
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
