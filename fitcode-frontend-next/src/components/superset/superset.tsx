'use client';

import { COLOR } from '@/common/constant/browser.constant';
import BorderColor from '@/components/border-color/border-color';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import {
  Superset as SupersetClass,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Box, Grid2, Stack, Typography } from '@mui/material';
import { Droppable } from 'react-beautiful-dnd';
import { handleDeleteSuperset } from '../trainer-day-view/state';
import { SetState } from '@/common/type/state.type';
import SupersetExercise from '../superset-exercise/superset-exercise';
import { useState } from 'react';

interface SupersetComponentProps {
  superset: SupersetClass;
  i: number;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: SetState<TrainingExercise | null>;
  menuExercise: TrainingExercise | null;
  setMenuExercise: SetState<TrainingExercise | null>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  setOpenVideoPlayerModal: SetState<boolean>;
  setOpenAddExerciseModal: SetState<boolean>;
  handleMenuClose: () => void;
  setSupersets: SetState<SupersetClass[]>;
  setsNumbers: { exerciseId: string; setsNumber: number }[];
  setSetsNumbers: SetState<{ exerciseId: string; setsNumber: number }[]>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export default function Superset(props: SupersetComponentProps) {
  const {
    superset,
    i,
    selectedExercise,
    setSelectedExercise,
    menuExercise,
    setMenuExercise,
    anchorEl,
    setAnchorEl,
    setOpenVideoPlayerModal,
    setOpenAddExerciseModal,
    handleMenuClose,
    setSupersets,
    setsNumbers,
    setSetsNumbers,
    expandedExercisesView,
    setExpandedExercisesView,
  } = props;

  const screenSize = useScreenSize();

  const { setDetectedChanges } = useGroup();
  const {
    training,
    setTraining,
    component,
    setComponent,
    supersets,
    selectedSubgroup,
    setSelectedSubgroup,
    setTodaysTrainings,
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
                    setTodaysTrainings,
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
                    selectedExercise={selectedExercise}
                    setSelectedExercise={setSelectedExercise}
                    menuExercise={menuExercise}
                    setMenuExercise={setMenuExercise}
                    anchorEl={anchorEl}
                    setAnchorEl={setAnchorEl}
                    setOpenVideoPlayerModal={setOpenVideoPlayerModal}
                    setOpenAddExerciseModal={setOpenAddExerciseModal}
                    handleMenuClose={handleMenuClose}
                    setSupersets={setSupersets}
                    setsNumbers={setsNumbers}
                    setSetsNumbers={setSetsNumbers}
                    expandedExercisesView={expandedExercisesView}
                    setExpandedExercisesView={setExpandedExercisesView}
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
                    setTodaysTrainings,
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
