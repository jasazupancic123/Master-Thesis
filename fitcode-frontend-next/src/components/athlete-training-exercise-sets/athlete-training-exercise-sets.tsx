import { Box, Grid2 } from '@mui/material';
import { useTheme } from '@mui/material';
import toast from 'react-hot-toast';

import { ExerciseParam } from '../exercise-param/exercise-param';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import { getLAndRValues } from '../training-exercise-card/state';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import { COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE } from '@/controller/training/constant/completed-future-workloads-default-value.constant';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size-provider';

interface AthleteTrainingExerciseSetsProps {
  training: Training;
  exercise: TrainingExercise;
  borderBottomRadius: boolean;
}

export default function AthleteTrainingExerciseSets(
  props: AthleteTrainingExerciseSetsProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { training, exercise, borderBottomRadius } = props;
  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      gap={0.9}
      sx={{
        backgroundColor: theme.palette.background.dark,
        pb: 1,
        borderBottomRightRadius: borderBottomRadius ? '5px' : 0,
        borderBottomLeftRadius: borderBottomRadius ? '5px' : 0,
      }}
    >
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
                mt={i === 0 ? 3.75 : 0.5}
              >
                <Box
                  key="exercise-title"
                  display="flex"
                  flexDirection="column"
                  gap={0.9}
                >
                  {exercise.exercise?.isBilateral ? (
                    <>
                      <LeftRightExerciseText title="L" />
                      <LeftRightExerciseText title="R" />
                    </>
                  ) : (
                    <LeftRightExerciseText title="B" />
                  )}
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
                      selectedAthleteWorkloads:
                        COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE,
                      selectedAthlete: undefined,
                    }
                  );

                  if (!valueL || (exercise.exercise?.isBilateral && !valueR))
                    return toast.error(
                      `Invalid parameter field: ${param.field}`
                    );

                  return (
                    <Box
                      key={param.field}
                      flexBasis={
                        (100 / exercise.params.length).toString() + '%'
                      }
                    >
                      {['L']
                        .concat(exercise.exercise?.isBilateral ? ['R'] : [])
                        .map((lOrR) => (
                          <ExerciseParam
                            key={`${param.field}-${lOrR}`}
                            showOptions={set.setNumber === 1 && lOrR === 'L'}
                            disableOptions
                            disableSets
                            param={param}
                            value={
                              lOrR === 'L'
                                ? param.field === ParamType.VolWorkSets
                                  ? ({
                                      ...valueL,
                                      value: set.setNumber.toString(),
                                    } as AttributeValue)
                                  : valueL
                                : param.field === ParamType.VolWorkSets
                                  ? ({
                                      ...valueR,
                                      value: set.setNumber.toString(),
                                    } as AttributeValue)
                                  : valueR || undefined
                            }
                            onOptionChange={() => {}}
                            onSubOptionChange={() => {}}
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
