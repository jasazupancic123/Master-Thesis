import {
  CheckBox,
  CheckBoxOutlineBlank,
  Delete,
  IndeterminateCheckBox,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import { deleteSelectedExercises } from '../trainer-group-day-view/state';
import type { SetState } from '@/common/type/state.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

interface TrainingComponentProps {
  trainingComponent: TrainingComponent;
  setOpenAddExerciseModal: SetState<boolean>;
  setOpenCalendarModal: SetState<boolean>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const {
    trainingComponent,
    setOpenAddExerciseModal,
    expandedExercisesView,
    setExpandedExercisesView,
  } = props;

  const theme = useTheme();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedExercises,
    setSelectedExercises,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    supersets,
  } = useTrainerDayViewContext();

  const { setDetectedChanges } = useGroup();

  return (
    <Box display="flex" p={0}>
      {trainingComponent.component && (
        <Box
          display="flex"
          alignItems="center"
          sx={{
            p: 0,
            m: 0,
          }}
        >
          {!selectedAthlete && trainingComponent?.id === component?.id ? (
            <Tooltip
              title="Add exercise"
              sx={{
                cursor: 'pointer',
              }}
            >
              <IconButton
                onClick={() => {
                  if (
                    component &&
                    trainingComponent &&
                    trainingComponent.id === component.id
                  )
                    setOpenAddExerciseModal(true);
                }}
                sx={{ p: 0, m: 0 }}
              >
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    width: 4,
                    height: 16,
                    borderRadius: 5,
                  }}
                />
              </IconButton>
            </Tooltip>
          ) : (
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                width: 4,
                height: 16,
                borderRadius: 5,
              }}
            />
          )}
          <Typography
            variant="body2"
            fontSize={12}
            noWrap
            sx={{
              color: theme.palette.primary.main,
              pl: 1,
              mb: 0,
              textTransform: 'uppercase',
              fontWeight: 350,
              cursor: 'pointer',
            }}
            onClick={() => {
              if (
                trainingComponent &&
                component &&
                trainingComponent.id === component.id
              ) {
                setComponent(undefined);
              } else {
                setTraining(training);
                setComponent(trainingComponent);
              }
              setSelectedExercises([]);
            }}
          >
            {trainingComponent.target
              ? `${trainingComponent.component.name} - ${trainingComponent.target.name}`
              : trainingComponent.component.name}
          </Typography>
          {component?.id === trainingComponent.id && (
            <Box display="flex" justifyContent="flex-start" gap={0.5}>
              <IconButton
                sx={{ p: 0, m: 0, ml: 1 }}
                onClick={() => setExpandedExercisesView((prev) => !prev)}
              >
                {expandedExercisesView ? (
                  <KeyboardArrowDown sx={{ fontSize: 18 }} />
                ) : (
                  <KeyboardArrowRight sx={{ fontSize: 18 }} />
                )}
              </IconButton>
              <>
                {supersets.flatMap((s) => s.exercises).length > 0 && (
                  <Tooltip
                    title={
                      supersets.flatMap((s) => s.exercises).length > 0 &&
                      supersets.every((s) =>
                        s.exercises.every((e) =>
                          selectedExercises.some((se) => se.id === e.id)
                        )
                      )
                        ? 'Deselect all exercises'
                        : 'Select all exercises'
                    }
                  >
                    <IconButton
                      sx={{ p: 0, m: 0 }}
                      onClick={() => {
                        const allExercisesSelected = supersets.every((s) =>
                          s.exercises.every((e) =>
                            selectedExercises.some((se) => se.id === e.id)
                          )
                        );
                        if (allExercisesSelected) {
                          setSelectedExercises([]);
                        } else {
                          setSelectedExercises(
                            supersets.flatMap((s) => s.exercises) || []
                          );
                        }
                      }}
                    >
                      {supersets.every((s) =>
                        s.exercises.every((e) =>
                          selectedExercises.some((se) => se.id === e.id)
                        )
                      ) ? (
                        <CheckBox sx={{ fontSize: 16 }} />
                      ) : supersets.some((s) =>
                          s.exercises.some((e) =>
                            selectedExercises.some((se) => se.id === e.id)
                          )
                        ) ? (
                        <IndeterminateCheckBox sx={{ fontSize: 16 }} />
                      ) : (
                        <CheckBoxOutlineBlank sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
                {!selectedAthlete && selectedExercises.length > 0 && (
                  <Tooltip title="Delete selected exercises">
                    <IconButton
                      sx={{ p: 0, m: 0 }}
                      onClick={() => {
                        deleteSelectedExercises(
                          {
                            selectedExercises,
                          },
                          {
                            component,
                            training,
                            setComponent,
                            setTraining,
                            setSelectedExercises,
                            selectedSubgroup,
                            setSelectedSubgroup,
                            setDetectedChanges,
                          }
                        );
                      }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
