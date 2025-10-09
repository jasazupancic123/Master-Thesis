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

import CompletedMembersGroup from './completed-members-group';
import { CommonService } from '@/common/service/common.service';
import type { SetState } from '@/common/type/state.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import {
  deleteSelectedExercises,
  handleSelectedExercisesSelection,
} from './actions/actions-selected-exercises';
import { handleSelectTrainingComponent } from './actions/actions-training-component';

const commonService = CommonService.instance;

interface TrainingComponentProps {
  trainingComponent: TrainingComponent;
  setOpenAddExerciseModal: SetState<boolean>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const { trainingComponent, expandedExercisesView, setExpandedExercisesView } =
    props;

  const theme = useTheme();

  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayViewContext();

  const { training, component, selectedExercises, selectedAthlete, supersets } =
    trainerDayViewContext;

  return (
    <Box display="flex" p={0}>
      {trainingComponent.component && (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          sx={{
            p: 0,
            pl: 2,
            m: 0,
          }}
        >
          <Typography fontSize={12}>
            {commonService.date.format(trainingComponent.from, {}, 'H:mm')}
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
              {trainingComponent.target
                ? `${trainingComponent.component.name} - ${trainingComponent.target.name}`
                : trainingComponent.component.name}
            </Typography>
            ;
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
                          handleSelectedExercisesSelection({
                            useTrainerDayViewContext:
                              useTrainerDayViewContext(),
                          });
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
                              useGroup: groupContext,
                              useTrainerDayViewContext: trainerDayViewContext,
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
