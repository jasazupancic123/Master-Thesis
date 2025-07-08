import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, Grid2, IconButton } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useScreenSize } from '@/store/screen-size-provider';
import { ExerciseParam } from '../exercise-param/exercise-param';
import { TrainingExercise } from '@/controller/training/type/training-plan.type';
import { useGroup } from '@/store/group-provider';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import toast from 'react-hot-toast';
import {
  getLAndRValues,
  handleAthleteWorkloadsChange,
} from '../training-exercise-card/state';
import { SetState } from '@/common/type/state.type';
import { updateExerciseAttributeValues } from './state';

interface TrainingExerciseCarExpandedSetsProps {
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  supersetIndex: number;
}

export default function TrainingExerciseCardExpandedSets(
  props: TrainingExerciseCarExpandedSetsProps
) {
  const screenSize = useScreenSize();

  const {
    training,
    component,
    supersets,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    selectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    selectedExercises,
  } = useTrainerDayViewContext();

  const { setDetectedChanges } = useGroup();
  const { setTraining } = useTrainerDayViewContext();

  const { exercise, expandedSetsView, setExpandedSetsView, supersetIndex } =
    props;

  if (!training || !component) return null;

  return (
    <Box display="flex" flexDirection="column" width="100%" gap={0.9}>
      {/* Expanded sets view */}
      {exercise.sets.map((set, i) => {
        return (
          <Grid2
            container
            spacing={1}
            columns={11}
            key={i}
            px={screenSize.isSmallerThanLaptop ? 1 : 0}
          >
            <Grid2 size={1}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.9}
                mt={i === 0 ? 0.9 : 0.5}
              >
                {i === 0 && (
                  <IconButton
                    disableRipple
                    sx={{
                      p: 0,
                      m: 0,
                    }}
                    onClick={() => setExpandedSetsView(!expandedSetsView)}
                  >
                    <KeyboardArrowRightIcon
                      sx={{
                        transform: expandedSetsView
                          ? 'rotate(90deg)'
                          : 'rotate(0deg)',
                        color: 'white',
                        fontSize: screenSize.isTablet ? 14 : 16,
                        ml: screenSize.isUltraSmall
                          ? 0
                          : screenSize.isMobile
                            ? 1
                            : 0,
                        transition: 'transform 0.3s ease-in-out',
                      }}
                    />
                  </IconButton>
                )}

                <Box
                  key="exercise-title"
                  display="flex"
                  flexDirection="column"
                  gap={0.9}
                >
                  <LeftRightExerciseText key="L" title="L" />
                  <LeftRightExerciseText key="R" title="R" />
                </Box>
              </Box>
            </Grid2>

            <Grid2 size={10}>
              <Box
                display="flex"
                width="100%"
                justifyContent="center"
                alignItems="center"
                gap={1}
              >
                {exercise.params.map((param, j) => {
                  /* find the custom workload for the selected athlete if selected, otherwise
                      get the value from the exercise sets */
                  const { valueL, valueR } = getLAndRValues(
                    {
                      set,
                      param,
                      setIndex: i,
                      paramIndex: j - 1,
                    },
                    {
                      training,
                      exercise,
                      selectedAthleteWorkloads,
                      customAthleteWorkloads,
                      selectedAthlete,
                    }
                  );

                  if (!valueL || !valueR) {
                    toast.error(`Invalid parameter field: ${param.field}`);
                    return null;
                  }

                  let min: number | undefined;
                  let max: number | undefined;
                  const attributeRange = exercise.attributeRanges.find(
                    (ar) => ar.field === param.field
                  );
                  if (attributeRange) {
                    const foundInOptions = attributeRange.options?.find(
                      (option) => option.field === valueL.selected
                    );
                    if (foundInOptions) {
                      min = foundInOptions.min;
                      max = foundInOptions.max;
                    } else {
                      min = attributeRange.min;
                      max = attributeRange.max;
                    }
                  }

                  return (
                    <Box
                      key={param.field}
                      flexBasis={
                        (100 / exercise.params.length).toString() + '%'
                      }
                    >
                      {['L', 'R'].map((lOrR) => (
                        <ExerciseParam
                          showOptions={set.setNumber === 1 && lOrR === 'L'}
                          disableOptions
                          disableSets
                          param={param}
                          value={lOrR === 'L' ? valueL : valueR}
                          onOptionChange={(newValue) => {}}
                          min={min}
                          max={max}
                          onSubOptionChange={(newValue) => {
                            if (+newValue < 0) return;

                            // update only selected athletes workloads
                            if (selectedAthlete) {
                              handleAthleteWorkloadsChange(
                                {
                                  exercise,
                                  setNumber: set.setNumber,
                                  param,
                                  newValue: newValue as string,
                                  leftOrRight: lOrR as 'L' | 'R',
                                },
                                {
                                  training,
                                  selectedAthleteWorkloads,
                                  setCustomAthleteWorkloads,
                                  selectedAthlete,
                                  customAthleteWorkloads,
                                }
                              );
                              return;
                            }

                            // update only the changed exercise
                            updateExerciseAttributeValues(
                              {
                                newValue,
                                i,
                                set,
                                lOrR: lOrR as 'L' | 'R',
                              },
                              {
                                selectedExercises,
                                exercise,
                                param,
                                training,
                                component,
                                setTraining,
                                supersets,
                                setDetectedChanges,
                                selectedSubgroup,
                                setSelectedSubgroup,
                                supersetIndex,
                              }
                            );
                          }}
                        />
                      ))}
                    </Box>
                  );
                })}
              </Box>
            </Grid2>
          </Grid2>
        );
      })}
    </Box>
  );
}
