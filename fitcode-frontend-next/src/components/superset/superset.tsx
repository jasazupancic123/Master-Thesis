'use client';

import { Box, Grid2, Stack, Typography } from '@mui/material';
import { Droppable } from 'react-beautiful-dnd';

import SupersetExercise from '../superset-exercise/superset-exercise';
import { handleDeleteSuperset } from '../trainer-day-view/state';
import { COLOR } from '@/common/constant/browser.constant';
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

  if (!component || !training) return null;

  const getBorderGradient = (): string => {
    const fromColor = COLOR[supersetIndex % COLOR.length];
    const toColor =
      supersets.length - 1 === supersetIndex
        ? COLOR[0]
        : COLOR[(supersetIndex + 1) % COLOR.length];
    return `linear-gradient(to bottom, ${fromColor}, ${toColor}) 1`;
  };

  return (
    <Grid2
      size={{
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
      }}
      key={`${component.id}-${supersetIndex}`}
      sx={{
        px: 0.5,
      }}
    >
      <Droppable
        key={`${component.id}-${supersetIndex}`}
        droppableId={`${component.id}-${supersetIndex}`}
        direction="vertical"
      >
        {(provided) => (
          <Stack
            ref={provided.innerRef}
            {...provided.droppableProps}
            p={screenSize.isLandscapeMobile ? 0.5 : 0}
            pt={0}
            sx={{
              border: '1px solid',
              borderRadius: 10,
              borderImage: getBorderGradient(),
            }}
          >
            <Box
              sx={{
                cursor: 'pointer',
              }}
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
            ></Box>

            <Grid2 container gap={0.5}>
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

              {provided.placeholder}
            </Grid2>

            <Box
              sx={{
                cursor: 'pointer',
              }}
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
        )}
      </Droppable>
    </Grid2>
  );
}
