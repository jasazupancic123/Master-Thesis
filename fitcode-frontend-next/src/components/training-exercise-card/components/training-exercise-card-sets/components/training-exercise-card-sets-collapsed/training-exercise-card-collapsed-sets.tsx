import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';
import toast from 'react-hot-toast';

import { ExerciseParam } from '../../../../../exercise-param/exercise-param';
import LeftRightExerciseText from '../../../../../left-right-exercise-text/left-right-exercise-text';
import type { SetState } from '@/common/type/state.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import useExerciseCollapsedSetsSetNumber from './hooks/use-set-number';
import { getMethodMinMax } from './actions/actions-method';
import { combineMinMax, getParamMinMax } from '../../actions/actions-method';
import {
  updateAttributeType,
  updateAttributeValue,
  updateSetNumbers,
} from './actions/actions-attribute';
import { getCorrectValuesForExerciseParam } from '../../actions/actions-exercise-param';
import { getLAndRValues } from '../../../../actions/actions-attribute-value';

export interface TrainingExerciseCardCollapsedSetsProps {
  component: TrainingComponent;
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  componentIndex: number | undefined;
}

export default function TrainingExerciseCardCollapsedSets(
  props: TrainingExerciseCardCollapsedSetsProps
) {
  const screenSize = useScreenSize();

  const { exercise, expandedSetsView, setExpandedSetsView, componentIndex } =
    props;

  const { setsNumbers, setSetsNumbers } = useSupersets();

  const { methods } = useMain();

  const { training, component, selectedSubgroup, selectedAthlete } =
    useTrainerDayViewContext();

  const { setNumber } = useExerciseCollapsedSetsSetNumber({
    exercise,
  });

  if (!training || !component) return null;

  return (
    <Grid2
      key={componentIndex}
      container
      spacing={1}
      columns={11}
      px={screenSize.isSmallerThanLaptop ? 1 : 0}
    >
      <Grid2 size={1}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.9}
          mt={0.8}
        >
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
                transform: expandedSetsView ? 'rotate(90deg)' : 'rotate(0deg)',
                color: 'white',
                fontSize: screenSize.isTablet ? 14 : 16,
                ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                transition: 'transform 0.3s ease-in-out',
              }}
            />
          </IconButton>
          <Box
            key="exercise-title"
            display="flex"
            flexDirection="column"
            gap={1}
          >
            {exercise.exercise?.isUnilateral ? (
              <>
                <LeftRightExerciseText key="L" title="L" />
                <LeftRightExerciseText key="R" title="R" />
              </>
            ) : (
              <>
                <LeftRightExerciseText key="single" title="" />
              </>
            )}
          </Box>
        </Box>
      </Grid2>

      <Grid2 size={10}>
        <Box
          key={exercise.id}
          display="flex"
          width="100%"
          justifyContent="center"
          alignItems={exercise.exercise?.isUnilateral ? 'center' : 'flex-start'}
          gap={1}
          sx={{
            height: 77,
          }}
        >
          {Array.isArray(exercise.params) &&
            exercise.params.map((param, i) => {
              /* find the custom workload for the selected athlete if selected, otherwise
                get the value from the exercise sets */

              const { valueL, valueR } = getLAndRValues({
                set: exercise.sets[0],
                param,
                setIndex: 0,
                paramIndex: i - 1,
                exercise,
              });

              if (!valueL || (exercise.exercise?.isUnilateral && !valueR)) {
                toast.error(`Invalid parameter field: ${param.field}`);
                return null;
              }

              if (setNumber === undefined || setNumber === null) return null;

              const method = methods.find((m) => m.id === component.methodId);
              const attributeRange = method?.attributes
                ?.map((a) =>
                  a.options?.find((o) => o.field === valueL.selected)
                )
                .find(Boolean);

              const paramMinMax = getParamMinMax(param, valueL);
              const methodMinMax = getMethodMinMax(
                { exercise, attributeRange, valueL, setNumber },
                {
                  useTrainerDayViewContext: useTrainerDayViewContext(),
                  useSupersets: useSupersets(),
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
                  flexBasis={(100 / exercise.params.length).toString() + '%'}
                >
                  {['L', ...(exercise.exercise?.isUnilateral ? ['R'] : [])].map(
                    (lOrR) => {
                      return (
                        <ExerciseParam
                          key={`${param.field}-${lOrR}`}
                          param={param}
                          value={
                            param.field === ParamType.VolWorkSets
                              ? lOrR === 'L'
                                ? ({
                                    field: valueL.field,
                                    selected: valueL.selected,
                                    value: setNumber.toString(),
                                  } as AttributeValue)
                                : valueR
                                  ? ({
                                      field: valueR.field,
                                      selected: valueR.selected,
                                      value: setNumber.toString(),
                                    } as AttributeValue)
                                  : undefined
                              : lOrR === 'L'
                                ? valueL
                                : valueR || undefined
                          }
                          showOptions={lOrR === 'L'}
                          exercise={exercise}
                          setsNumbers={setsNumbers}
                          setSetsNumbers={setSetsNumbers}
                          min={min}
                          max={max}
                          disableOptions={selectedAthlete !== undefined}
                          onOptionChange={(newValue) => {
                            // dissable for custom workloads subgroup
                            if (selectedSubgroup?.parentId) return;

                            const attributeRangeFresh = method?.attributes
                              ?.map((a) =>
                                a.options?.find((o) => o.field === newValue)
                              )
                              .find(Boolean);

                            const { min: curMin, max: curMax } =
                              getMethodMinMax(
                                {
                                  exercise,
                                  attributeRange: attributeRangeFresh,
                                  valueL,
                                  setNumber,
                                },
                                {
                                  useTrainerDayViewContext:
                                    useTrainerDayViewContext(),
                                  useSupersets: useSupersets(),
                                }
                              );

                            updateAttributeType(
                              {
                                exercise,
                                param,
                                newValue,
                                lOrR,
                                min: curMin,
                                max: curMax,
                              },
                              {
                                useTrainerDayViewContext: {
                                  ...useTrainerDayViewContext(),
                                  training,
                                  component,
                                },
                              }
                            );
                          }}
                          onSubOptionChange={(newValue) => {
                            if (+newValue < 0) return;

                            const correctValues =
                              getCorrectValuesForExerciseParam(
                                {
                                  exercise,
                                  param,
                                },
                                {
                                  useTrainerDayView: {
                                    ...useTrainerDayViewContext(),
                                    training,
                                    component,
                                  },
                                  useSupersets: useSupersets(),
                                }
                              );

                            if (!correctValues) return;

                            const {
                              correctSelectedSubgroup,
                              correctSupersets,
                              correctSelectedExercises,
                              correctSetsNumbers,
                              correctExercise,
                            } = correctValues;

                            if (param.field === ParamType.VolWorkSets) {
                              updateSetNumbers(
                                {
                                  newValue,
                                  correctExercise,
                                  correctSelectedSubgroup,
                                  correctSupersets,
                                  correctSelectedExercises,
                                  correctSetsNumbers,
                                },
                                {
                                  useMain: useMain(),
                                  useGroup: useGroup(),
                                  useTrainerDayView: {
                                    ...useTrainerDayViewContext(),
                                    training,
                                    component,
                                  },
                                  useSupersets: useSupersets(),
                                }
                              );
                              return;
                            }

                            updateAttributeValue(
                              {
                                param,
                                newValue,
                                lOrR,
                                correctExercise,
                                correctSelectedExercises,
                                correctSupersets,
                                correctSelectedSubgroup,
                              },
                              {
                                useGroup: useGroup(),
                                useTrainerDayView: {
                                  ...useTrainerDayViewContext(),
                                  training,
                                  component,
                                },
                              }
                            );
                          }}
                        />
                      );
                    }
                  )}
                </Box>
              );
            })}
        </Box>
      </Grid2>
    </Grid2>
  );
}
