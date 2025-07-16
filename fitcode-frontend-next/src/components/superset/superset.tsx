'use client';

import { COLOR } from '@/common/constant/browser.constant';
import BorderColor from '@/components/border-color/border-color';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Superset as SupersetClass } from '@/controller/training/type/training-plan.type';
import { Box, Grid2, Stack, Typography } from '@mui/material';
import { Droppable } from 'react-beautiful-dnd';
import { handleDeleteSuperset } from '../trainer-day-view/state';
import SupersetExercise from '../superset-exercise/superset-exercise';
import { useSupersets } from '@/store/supersets-provider';

interface SupersetComponentProps {
  superset: SupersetClass;
  i: number;
}

export default function Superset(props: SupersetComponentProps) {
  const { superset, i } = props;

  const screenSize = useScreenSize();

  const { selectedExercise, setOpenAddExerciseModal } = useSupersets();
  const { setDetectedChanges } = useGroup();
  const {
    training,
    setTraining,
    component,
    setComponent,
    supersets,
    selectedSubgroup,
    setSelectedSubgroup,
    setSupersets,
  } = useTrainerDayViewContext();

  if (!component || !training) return null;

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
      key={`${component.id}-${i}`}
      sx={{
        px: 0.5,
      }}
    >
      <Droppable
        key={`${component.id}-${i}`}
        droppableId={`${component.id}-${i}`}
        direction="vertical"
      >
        {(provided) => (
          <Stack
            ref={provided.innerRef}
            {...provided.droppableProps}
            p={screenSize.isLandscapeMobile ? 0.5 : 0}
            pt={0}
          >
            <Box
              sx={{
                cursor: 'pointer',
              }}
              onClick={() =>
                handleDeleteSuperset(
                  { index: i },
                  {
                    training,
                    setTraining,
                    supersets,
                    component,
                    setComponent,
                    selectedSubgroup,
                    setSelectedSubgroup,
                    setDetectedChanges,
                  }
                )
              }
            >
              <BorderColor
                color={COLOR[i % COLOR.length]}
                applyMargin
                marginValue={superset.exercises.length === 0 ? '3px' : '5px'}
              />
            </Box>

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
                superset.exercises.map((exercise, k) => (
                  <SupersetExercise
                    key={`${component.id}-${i}-${k}`}
                    exercise={exercise}
                    superset={superset}
                    i={i}
                    k={k}
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
                  { index: i },
                  {
                    training,
                    setTraining,
                    supersets,
                    component,
                    setComponent,
                    selectedSubgroup,
                    setSelectedSubgroup,
                    setDetectedChanges,
                  }
                )
              }
            >
              <BorderColor
                color={COLOR[i % COLOR.length]}
                lower
                applyMargin
                marginValue={superset.exercises.length === 0 ? '3px' : '5px'}
              />
            </Box>
          </Stack>
        )}
      </Droppable>
    </Grid2>
  );
}
