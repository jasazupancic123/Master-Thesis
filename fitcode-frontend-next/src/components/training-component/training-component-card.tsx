import {
  CheckBox,
  CheckBoxOutlineBlank,
  Delete,
  Dock,
  IndeterminateCheckBox,
  KeyboardArrowDown,
  KeyboardArrowRight,
  PlayCircle,
  StopCircle,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import {
  deleteSelectedExercises,
  handleSelectedExercisesSelection,
} from './actions/actions-selected-exercises';
import { handleSelectTrainingComponent } from './actions/actions-training-component';
import CompletedMembersGroup from './completed-members-group';
import { core } from '@/core/core.service';
import { TrainingController } from '@/core/training/training.controller';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

interface TrainingComponentProps {
  trainingComponent: TrainingComponent;
}

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const theme = useTheme();
  const router = useRouter();

  const { trainingComponent } = props;

  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();

  const {
    training,
    component,
    selectedExerciseIds,
    selectedAthlete,
    supersets,
    expandedExercisesView,
    setExpandedExercisesView,
  } = trainerDayViewContext;

  const selectedComponent = core.training.component.find(trainingComponent.id);
  const target = core.training.component.findTarget(trainingComponent.targetId);

  return (
    <Box display="flex" p={0}>
      {selectedComponent && (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          sx={{ p: 0, pl: 2, m: 0 }}
        >
          <Typography fontSize={12}>
            {lib.common.date.format(trainingComponent.from, {}, 'H:mm')}
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography
              fontSize={16}
              fontWeight={550}
              noWrap
              sx={{
                color:
                  component?.id === trainingComponent.id
                    ? theme.palette.primary.main
                    : undefined,
                mb: 0,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onClick={() => {
                handleSelectTrainingComponent(
                  { trainingComponent },
                  { useTrainerDayViewContext: trainerDayViewContext }
                );
              }}
            >
              {target
                ? `${selectedComponent.name} - ${target.name}`
                : selectedComponent.name}
            </Typography>

            {component?.id === trainingComponent.id && (
              <Box display="flex" justifyContent="flex-start" gap={1}>
                <IconButton
                  sx={{ p: 0, m: 0, ml: 1 }}
                  onClick={() => setExpandedExercisesView((prev) => !prev)}
                >
                  {expandedExercisesView ? (
                    <KeyboardArrowDown fontSize="small" />
                  ) : (
                    <KeyboardArrowRight fontSize="small" />
                  )}
                </IconButton>
                <>
                  {supersets.flatMap((s) => s.exercises).length > 0 && (
                    <Tooltip
                      title={
                        supersets.flatMap((s) => s.exercises).length > 0 &&
                        supersets.every((s) =>
                          s.exercises.every((e) =>
                            selectedExerciseIds.some(
                              (selectedId) => selectedId === e.id
                            )
                          )
                        )
                          ? 'Deselect all exercises'
                          : 'Select all exercises'
                      }
                    >
                      <IconButton
                        sx={{ p: 0, m: 0 }}
                        onClick={() => {
                          handleSelectedExercisesSelection(
                            trainerDayViewContext
                          );
                        }}
                      >
                        {supersets.every((s) =>
                          s.exercises.every((e) =>
                            selectedExerciseIds.some(
                              (selectedId) => selectedId === e.id
                            )
                          )
                        ) ? (
                          <CheckBox fontSize="small" />
                        ) : supersets.some((s) =>
                            s.exercises.some((e) =>
                              selectedExerciseIds.some(
                                (selectedId) => selectedId === e.id
                              )
                            )
                          ) ? (
                          <IndeterminateCheckBox sx={{ fontSize: 16 }} />
                        ) : (
                          <CheckBoxOutlineBlank sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}

                  {!selectedAthlete && selectedExerciseIds.length > 0 && (
                    <Tooltip title="Delete selected exercises">
                      <IconButton
                        sx={{ p: 0, m: 0 }}
                        onClick={() => {
                          deleteSelectedExercises(selectedExerciseIds, {
                            useGroup: groupContext,
                            useTrainerDayViewContext: trainerDayViewContext,
                          });
                        }}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
                {training && dayjs(training.from).isSame(dayjs(), 'day') && (
                  <>
                    <Tooltip title="Start component">
                      <IconButton
                        sx={{ p: 0, m: 0 }}
                        onClick={async () => {
                          if (!training || !component) return;

                          handleApiRequest(
                            router,
                            () =>
                              TrainingController.getInstance().startTrainingComponent(
                                training.id,
                                component.id
                              ),
                            () => {
                              toast.success('Component started successfully.');
                            },
                            undefined,
                            'Failed to start component.'
                          );
                        }}
                      >
                        <PlayCircle fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="End component">
                      <IconButton
                        sx={{ p: 0, m: 0 }}
                        onClick={() => {
                          if (!training || !component) return;

                          handleApiRequest(
                            router,
                            () =>
                              TrainingController.getInstance().completeTrainingComponent(
                                training.id,
                                component.id
                              ),
                            () => {
                              toast.success('Component ended successfully.');
                            },
                            undefined,
                            'Failed to end component.'
                          );
                        }}
                      >
                        <StopCircle fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create station">
                      <IconButton
                        sx={{ p: 0, m: 0 }}
                        onClick={async () => {
                          if (!training || !component) return;

                          handleApiRequest(
                            router,
                            () =>
                              TrainingController.getInstance().startTrainingComponent(
                                training.id,
                                component.id
                              ),
                            () => {
                              toast.success('Component started successfully.');

                              router.push(
                                `/training/${training.id}/component/${component.id}/station`
                              );
                            },
                            undefined,
                            'Failed to create station.'
                          );
                        }}
                      >
                        <Dock fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            )}

            {training && (
              <Box ml={2}>
                <CompletedMembersGroup componentId={trainingComponent.id} />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
