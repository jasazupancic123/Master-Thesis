import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';
import toast from 'react-hot-toast';

import { getCorrectValuesForExerciseParam } from '../../actions/actions-exercise-param';
import { combineMinMax, getParamMinMax } from '../../actions/actions-method';
import { getMethodMinMax } from '../training-exercise-card-sets-collapsed/actions/actions-method';
import { updateExerciseAttributeValues } from './actions/actions-attribute-values';
import type { SetState } from '@/common/type/state.type';
import { ExerciseParam } from '@/components/exercise-param/exercise-param';
import { getLAndRValues } from '@/components/training-exercise-card/actions/actions-attribute-value';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import LeftRightExerciseText from '@/util/left-right-exercise-text/left-right-exercise-text';

interface TrainingExerciseCarExpandedSetsProps {
  component: TrainingComponent;
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  supersetIndex: number;
}

export default function TrainingExerciseCardExpandedSets(
  props: TrainingExerciseCarExpandedSetsProps
) {
  const screenSize = useScreenSize();

  const mainContext = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayViewContext();
  const supersetsContext = useSupersets();

  const { methods } = mainContext;

  const { setDetectedChanges } = groupContext;

  const { training, setTraining, component, setSelectedSubgroup } =
    trainerDayViewContext;

  const { exercise, expandedSetsView, setExpandedSetsView } = props;

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
                  {exercise.exercise?.isUnilateral ? (
                    <>
                      <LeftRightExerciseText title="L" />
                      <LeftRightExerciseText title="R" />
                    </>
                  ) : (
                    <LeftRightExerciseText title="" />
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
                  const { valueL, valueR } = getLAndRValues({
                    set,
                    param,
                    setIndex: i,
                    paramIndex: j - 1,
                    exercise,
                  });

                  if (!valueL || (exercise.exercise?.isUnilateral && !valueR))
                    return toast.error(
                      `Invalid parameter field: ${param.field}`
                    );

                  const method = methods.find(
                    (m) => m.id === component.methodId
                  );

                  const attributeRange = method?.attributes
                    ?.map((a) =>
                      a.options?.find((o) => o.field === valueL.selected)
                    )
                    .find(Boolean);

                  const paramMinMax = getParamMinMax(param, valueL);
                  const methodMinMax = getMethodMinMax(
                    {
                      exercise,
                      attributeRange,
                      valueL,
                      setNumber: set.setNumber,
                    },
                    {
                      useTrainerDayViewContext: trainerDayViewContext,
                      useSupersets: supersetsContext,
                    }
                  );

                  const { min, max } = combineMinMax(
                    paramMinMax.min,
                    paramMinMax.max,
                    methodMinMax.min,
                    methodMinMax.max
                  );

                  return (
                    <Box
                      key={param.field}
                      flexBasis={
                        (100 / exercise.params.length).toString() + '%'
                      }
                    >
                      {['L']
                        .concat(exercise.exercise?.isUnilateral ? ['R'] : [])
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
                            onOptionChange={(_newValue) => {}}
                            min={min}
                            max={max}
                            onSubOptionChange={(newValue) => {
                              if (+newValue < 0) return;

                              const correctValues =
                                getCorrectValuesForExerciseParam(
                                  { exercise },
                                  {
                                    useTrainerDayView: {
                                      ...trainerDayViewContext,
                                      training,
                                      component,
                                    },
                                    useSupersets: supersetsContext,
                                  }
                                );

                              if (!correctValues) return;

                              const {
                                correctSelectedSubgroup,
                                correctSupersets,
                                correctSelectedExercises,
                                correctExercise,
                                correctSet,
                                correctParam,
                              } = correctValues;

                              // update only the changed exercise
                              updateExerciseAttributeValues(
                                {
                                  newValue,
                                  i,
                                  set: correctSet || set,
                                  lOrR: lOrR as 'L' | 'R',
                                  correctSelectedExercises,
                                  correctExercise,
                                  correctParam: correctParam || param,
                                  correctSupersets,
                                  correctSelectedSubgroup,
                                },
                                {
                                  training,
                                  setTraining,
                                  component,
                                  setSelectedSubgroup,
                                  setDetectedChanges,
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
