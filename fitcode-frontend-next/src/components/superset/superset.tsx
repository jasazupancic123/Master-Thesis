'use client';

import { useDroppable } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { Box, Grid2, Stack, Typography } from '@mui/material';

import SupersetExercise from '../superset-exercise/superset-exercise';
import { handleDeleteSuperset } from '../trainer-day-view/state';
import { getBorderGradient } from './state';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Superset as SupersetClass } from '@/controller/training/type/superset.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useSupersets } from '@/store/supersets-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface SupersetComponentProps {
  superset: SupersetClass;
  supersetIndex: number;
}

export default function Superset(props: SupersetComponentProps) {
  const { superset, supersetIndex } = props;

  const screenSize = useScreenSize();

  const { selectedExercise, setOpenAddExerciseModal } = useSupersets();
  const { setTrainings, setDetectedChanges } = useGroup();
  const {
    training,
    setTraining,
    component,
    setComponent,
    supersets,
    selectedSubgroup,
    setSelectedSubgroup,
    setSelectedExercises,
    setCustomAthleteWorkloads,
  } = useTrainerDayViewContext();

  const containerId = `${component?.id}-${supersetIndex}`;
  const items = superset.exercises.map((e) => e.id);
  const { setNodeRef } = useDroppable({ id: containerId });

  if (!component || !training) return null;

  return (
    <Grid2
      key={`${component.id}-${supersetIndex}`}
      size={
        (selectedSubgroup || component).mainSet === MainSet.CIRCUIT
          ? 12
          : {
              xs: 12,
              sm:
                selectedExercise &&
                superset.exercises.some((e) => e.id === selectedExercise.id)
                  ? 12
                  : screenSize.isLandscapeMobile
                    ? 4
                    : 6,
              md:
                selectedExercise &&
                superset.exercises.some((e) => e.id === selectedExercise.id)
                  ? screenSize.isLandscapeMobile
                    ? 4
                    : 6
                  : screenSize.isLandscapeMobile
                    ? 4
                    : 3,
            }
      }
      sx={{ px: 0.5 }}
    >
      <Box
        ref={setNodeRef}
        sx={{
          p: '1px',
          borderRadius: '5px',
          background: getBorderGradient(
            supersetIndex,
            supersets.length === 1 ||
              (supersets.length === 5 && supersetIndex === 4)
          ),
        }}
      >
        <Stack
          p={screenSize.isLandscapeMobile ? 0.5 : 0}
          pt={0}
          sx={{ bgcolor: 'background.default', borderRadius: '5px' }}
        >
          <Box
            sx={{ cursor: 'pointer' }}
            onClick={() =>
              handleDeleteSuperset(
                { index: supersetIndex },
                {
                  training,
                  setTraining,
                  supersets,
                  component,
                  setComponent,
                  selectedSubgroup,
                  setSelectedSubgroup,
                  setTrainings,
                  setDetectedChanges,
                  setCustomAthleteWorkloads,
                  setSelectedExercises,
                }
              )
            }
          />

          <SortableContext
            id={containerId}
            items={items}
            strategy={rectSortingStrategy}
          >
            <Grid2
              container
              columnSpacing={
                (selectedSubgroup || component).mainSet === MainSet.CIRCUIT
                  ? 0.3
                  : undefined
              }
            >
              {supersets.length === 1 && superset.exercises.length === 0 ? (
                <Box
                  border="1px dashed #B2B3B7"
                  borderRadius={2}
                  sx={{ cursor: 'pointer' }}
                  p={1}
                  py={3}
                  width="100%"
                  height="100%"
                  textAlign="center"
                  onClick={() => setOpenAddExerciseModal(true)}
                >
                  <Typography variant="body2" align="center">
                    Add exercise
                  </Typography>
                </Box>
              ) : (
                superset.exercises.map((exercise, exerciseIndex) => (
                  <SupersetExercise
                    key={`${component.id}-${supersetIndex}-${exerciseIndex}`}
                    exercise={exercise}
                    superset={superset}
                    supersetIndex={supersetIndex}
                    exerciseIndex={exerciseIndex}
                  />
                ))
              )}
            </Grid2>
          </SortableContext>

          <Box
            sx={{ cursor: 'pointer' }}
            onClick={() =>
              handleDeleteSuperset(
                { index: supersetIndex },
                {
                  training,
                  setTraining,
                  supersets,
                  component,
                  setComponent,
                  selectedSubgroup,
                  setSelectedSubgroup,
                  setTrainings,
                  setDetectedChanges,
                  setCustomAthleteWorkloads,
                  setSelectedExercises,
                }
              )
            }
          />
        </Stack>
      </Box>
    </Grid2>
  );
}
