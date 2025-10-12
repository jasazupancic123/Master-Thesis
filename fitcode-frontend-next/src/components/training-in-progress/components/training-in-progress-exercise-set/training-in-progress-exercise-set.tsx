import { Box } from '@mui/material';

import { ExerciseParam } from '../../../exercise-param/exercise-param';
import LeftRightExerciseText from '../../../../util/left-right-exercise-text/left-right-exercise-text';
import TrainingExerciseSetDoneCheckbox from '../training-in-progress-exercise-card/components/training-exercise-set-done-checkbox';
import type { SetState } from '@/common/type/state.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useTraining } from '@/store/training.provider';

interface TrainingInProgressExerciseSetProps {
  set: ExerciseSet;
  exercise: TrainingExercise;
  selectedSuperset: Superset;
  setSelectedSuperset: SetState<Superset | undefined>;
  setIndex: number;
  isUnilateral: boolean;
  showOptions?: boolean;
  showDoneCheckbox?: boolean;
}

export default function TrainingInProgressExerciseSet(
  props: TrainingInProgressExerciseSetProps
) {
  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const {
    set,
    exercise,
    selectedSuperset,
    setSelectedSuperset,
    setIndex,
    isUnilateral,
    showOptions,
    showDoneCheckbox,
  } = props;

  if (!trainingInProgress) return null;

  return (
    <Box width="100%" display="flex" alignItems="center">
      <Box
        key={`${set.setNumber}${setIndex}`}
        display="flex"
        width="100%"
        justifyContent="center"
        alignItems="center"
        gap={1}
      >
        {isUnilateral && (
          <Box
            display="flex"
            flexDirection="column"
            gap={1}
            justifyContent="end"
            height={setIndex === 0 || showOptions ? 80 : 55}
          >
            <LeftRightExerciseText title="L" />
            <LeftRightExerciseText title="R" />
          </Box>
        )}

        {Array.isArray(exercise.params) &&
          exercise.params.map((param) => {
            const valueL = set.paramValuesL.find(
              (pv) => pv.field === param.field
            ) || {
              field: param.field,
              selected: 'set',
              value: (setIndex + 1).toString(),
            };

            const valueR = set.paramValuesR
              ? set.paramValuesR.find((pv) => pv.field === param.field) || {
                  field: param.field,
                  selected: 'set',
                  value: (setIndex + 1).toString(),
                }
              : undefined;

            const value = valueL;

            return isUnilateral ? (
              <Box
                key={param.field}
                flexBasis={(100 / exercise.params.length).toString() + '%'}
              >
                <ExerciseParam
                  showOptions={setIndex === 0 || showOptions}
                  disableSets
                  param={param}
                  value={valueL}
                  onOptionChange={() => {}}
                  onSubOptionChange={(newValue) => {
                    if (+newValue < 0 || param.field === ParamType.VolWorkSets)
                      return;

                    const paramIndex = exercise.sets[0].paramValuesL.findIndex(
                      (pv) => pv.field === param.field
                    );

                    const newExercise = { ...exercise };

                    const updatedSets: ExerciseSet[] = newExercise.sets.map(
                      (set, j) =>
                        setIndex !== j
                          ? set
                          : {
                              setNumber: set.setNumber,
                              paramValuesL: [...set.paramValuesL].map(
                                (param, index) =>
                                  ({
                                    field: param.field,
                                    selected: param.selected,
                                    value:
                                      index === paramIndex
                                        ? (newValue as string)
                                        : param.value,
                                  }) as AttributeValue
                              ),
                              paramValuesR: set.paramValuesR,
                            }
                    );

                    newExercise.sets = [...updatedSets];

                    const newExercises = selectedSuperset.exercises.map(
                      (ex) => {
                        if (ex.id === exercise.id) {
                          return newExercise;
                        }
                        return ex;
                      }
                    );

                    const newSuperset = {
                      ...selectedSuperset,
                      exercises: newExercises,
                    };

                    setSelectedSuperset((prev) => {
                      if (!prev) return undefined;
                      return newSuperset;
                    });

                    const newSupersets = trainingInProgress.supersets.map(
                      (superset, j) =>
                        j === trainingInProgress.supersetIndex
                          ? newSuperset
                          : superset
                    );

                    setTrainingInProgress((prev) => {
                      if (!prev) return null;
                      return { ...prev, supersets: newSupersets };
                    });
                  }}
                />

                {isUnilateral && valueR && (
                  <ExerciseParam
                    showOptions={false}
                    disableSets
                    param={param}
                    value={valueR}
                    onOptionChange={() => {}}
                    onSubOptionChange={(newValue) => {
                      if (
                        +newValue < 0 ||
                        param.field === ParamType.VolWorkSets
                      )
                        return;

                      const paramIndex =
                        exercise.sets[0].paramValuesL.findIndex(
                          (pv) => pv.field === param.field
                        );

                      const newExercise = { ...exercise };

                      const updatedSets: ExerciseSet[] = newExercise.sets.map(
                        (set, j) => {
                          if (setIndex !== j) return set;
                          return {
                            setNumber: set.setNumber,
                            paramValuesL: set.paramValuesL,
                            paramValuesR: set.paramValuesR
                              ? [...set.paramValuesR].map(
                                  (param, index) =>
                                    ({
                                      field: param.field,
                                      selected: param.selected,
                                      value:
                                        index === paramIndex
                                          ? (newValue as string)
                                          : param.value,
                                    }) as AttributeValue
                                )
                              : undefined,
                          };
                        }
                      );

                      newExercise.sets = [...updatedSets];

                      const newExercises = selectedSuperset.exercises.map(
                        (ex) => {
                          if (ex.id === exercise.id) {
                            return newExercise;
                          }
                          return ex;
                        }
                      );

                      const newSuperset = {
                        ...selectedSuperset,
                        exercises: newExercises,
                      };

                      setSelectedSuperset((prev) => {
                        if (!prev) return undefined;
                        return newSuperset;
                      });

                      const newSupersets = trainingInProgress.supersets.map(
                        (superset, j) =>
                          j === trainingInProgress.supersetIndex
                            ? newSuperset
                            : superset
                      );

                      setTrainingInProgress((prev) => {
                        if (!prev) return null;
                        return { ...prev, supersets: newSupersets };
                      });
                    }}
                  />
                )}
              </Box>
            ) : (
              <Box
                key={param.field}
                flexBasis={(100 / exercise.params.length).toString() + '%'}
              >
                <ExerciseParam
                  showOptions={setIndex === 0 || showOptions}
                  disableSets
                  param={param}
                  value={value!}
                  onOptionChange={() => {}}
                  onSubOptionChange={(newValue) => {
                    if (+newValue < 0 || param.field === ParamType.VolWorkSets)
                      return;

                    const paramIndex = exercise.sets[0].paramValuesL.findIndex(
                      (pv) => pv.field === param.field
                    );

                    const newExercise = { ...exercise };

                    const updatedSets: ExerciseSet[] = newExercise.sets.map(
                      (set, j) => {
                        if (setIndex !== j) return set;
                        return {
                          setNumber: set.setNumber,
                          paramValuesL: [...set.paramValuesL].map(
                            (param, index) =>
                              ({
                                field: param.field,
                                selected: param.selected,
                                value:
                                  index === paramIndex
                                    ? (newValue as string)
                                    : param.value,
                              }) as AttributeValue
                          ),
                          paramValuesR: set.paramValuesR
                            ? [...set.paramValuesR].map((param, index) => ({
                                field: param.field,
                                selected: param.selected,
                                value:
                                  index === paramIndex
                                    ? (newValue as string)
                                    : param.value,
                              }))
                            : undefined,
                        };
                      }
                    );

                    newExercise.sets = [...updatedSets];

                    const newExercises = selectedSuperset.exercises.map(
                      (ex) => {
                        if (ex.id === exercise.id) {
                          return newExercise;
                        }
                        return ex;
                      }
                    );

                    const newSuperset = {
                      ...selectedSuperset,
                      exercises: newExercises,
                    };

                    setSelectedSuperset((prev) => {
                      if (!prev) return undefined;
                      return newSuperset;
                    });

                    const newSupersets = trainingInProgress.supersets.map(
                      (superset, j) => {
                        if (j === trainingInProgress.supersetIndex) {
                          return newSuperset;
                        }
                        return superset;
                      }
                    );

                    setTrainingInProgress((prev) => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        supersets: newSupersets,
                      } as TrainingInProgress;
                    });
                  }}
                />
              </Box>
            );
          })}
      </Box>
      {showDoneCheckbox && (
        <TrainingExerciseSetDoneCheckbox
          exercise={exercise}
          setIndex={set.setNumber - 1}
          applyTopMargin={showOptions}
          small
        />
      )}
    </Box>
  );
}
