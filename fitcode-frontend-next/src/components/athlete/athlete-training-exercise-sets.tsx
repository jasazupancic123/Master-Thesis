import { Box, Grid2 } from '@mui/material';
import { useTheme } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import { core } from '@/core/core.service';
import { KG } from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
  training: Training;
  exercise: TrainingExercise;
  borderBottomRadius: boolean;
  expanded?: boolean;
  trainingInProgressView?: boolean;
  passedSet?: ExerciseSet;
  setIndex?: number;
  supersetIndex?: number;
  componentId?: string;
  trainingId?: string;
  dissableBottomPadding?: boolean;
  aiDetectionView?: boolean;
}

export default function AthleteTrainingExerciseSets({
  exercise,
  borderBottomRadius,
  expanded,
  passedSet,
  setIndex,
  dissableBottomPadding,
  trainingInProgressView,
}: Props) {
  const { activeTraining } = useMain();

  const theme = useTheme();
  const screenSize = useScreenSize();

  const uni = exercise.exercise?.isUnilateral;
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);
  const load = exercise.sets[setIndex || 0].loadKg;

  const volOptions = core.training.set.getVolOptions(exercise.exercise!);
  const intOptions = core.training.set.getIntOptions(exercise.exercise!);
  const effOptions = core.training.set.getEffOptions(exercise.exercise!);
  const recOptions = core.training.set.getRecOptions(exercise.exercise!);

  const volParam = volType && volOptions.length > 0;
  const loadParam = load !== undefined && intOptions.length > 0;
  const effTempoParam = effType && effOptions.length > 0;
  const recParam = recType && recOptions.length > 0;

  const totalParams =
    (volParam ? 1 : 0) +
    (loadParam ? 1 : 0) +
    (effTempoParam ? 1 : 0) +
    (recParam ? 1 : 0);

  const widthParam = `${100 / totalParams}%`;

  return (
    <Box
      id="athlete-training-exercise-sets-container"
      display="flex"
      flexDirection="column"
      width="100%"
      gap={0.9}
      sx={{
        backgroundColor: trainingInProgressView
          ? theme.palette.background.default
          : theme.palette.background.dark,
        pb: !dissableBottomPadding ? 1 : undefined,
        borderBottomRightRadius: borderBottomRadius ? '5px' : 0,
        borderBottomLeftRadius: borderBottomRadius ? '5px' : 0,
      }}
    >
      {/* Expanded sets view */}
      {(passedSet ? [passedSet] : exercise.sets).map((set, i) => {
        if (!expanded && i > 0) return null;
        const index = setIndex !== undefined ? setIndex : i;

        return (
          <Grid2
            key={i}
            container
            spacing={0.5}
            columns={11}
            px={
              trainingInProgressView
                ? 0
                : screenSize.isSmallerThanLaptop
                  ? 1
                  : 0
            }
          >
            <Grid2 size={0.5}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.9}
                mt={3.7}
              >
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
                    <LeftRightExerciseText
                      title={trainingInProgressView ? '' : 'B'}
                    />
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
              >
                {volParam && (
                  <Box
                    width={widthParam}
                    display="flex"
                    justifyContent="center"
                  >
                    <NumberExerciseParam
                      options={volOptions}
                      selected={volType}
                      value={exercise.sets[index]?.[volType] || 0}
                      exercise={exercise}
                      disableOptions
                      onInputChange={(_) => {}}
                    />
                  </Box>
                )}

                {loadParam && (
                  <Box
                    width={widthParam}
                    display="flex"
                    justifyContent="center"
                  >
                    <NumberExerciseParam
                      options={[KG]}
                      selected={KG.field}
                      value={exercise.sets[index]?.[KG.field] || 0}
                      exercise={exercise}
                      disableOptions
                      onInputChange={(_) => {}}
                    />
                  </Box>
                )}

                {effTempoParam ? (
                  effType === 'tempoEcc' ? (
                    <Box
                      width={widthParam}
                      display="flex"
                      justifyContent="center"
                    >
                      <TempoExerciseParam
                        options={effOptions}
                        selected={effType}
                        value={core.training.set.getTempo(exercise.sets[index])}
                        exercise={exercise}
                        disableOptions
                        onInputChange={(_) => {}}
                      />
                    </Box>
                  ) : (
                    <Box
                      width={widthParam}
                      display="flex"
                      justifyContent="center"
                    >
                      <NumberExerciseParam
                        options={effOptions}
                        selected={effType}
                        value={exercise.sets[index]?.[effType] || 0}
                        exercise={exercise}
                        disableOptions
                        onInputChange={(_) => {}}
                      />
                    </Box>
                  )
                ) : null}

                {recParam && (
                  <Box
                    width={widthParam}
                    display="flex"
                    justifyContent="center"
                  >
                    <NumberExerciseParam
                      options={recOptions}
                      selected={recType}
                      value={exercise.sets[index][recType] || 0}
                      exercise={exercise}
                      disableOptions
                      onInputChange={(_) => {}}
                    />
                  </Box>
                )}
              </Box>

              {uni && (
                <Box
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  {volParam && (
                    <Box
                      width={widthParam}
                      display="flex"
                      justifyContent="center"
                    >
                      <NumberExerciseParam
                        options={volOptions}
                        selected={volType}
                        value={
                          exercise.sets[0]?.[
                            core.exercise.param.pairs[volType]
                          ] as number
                        }
                        exercise={exercise}
                        showOptions={false}
                        onInputChange={(_) => {}}
                      />
                    </Box>
                  )}

                  {loadParam && (
                    <Box
                      width={widthParam}
                      display="flex"
                      justifyContent="center"
                    >
                      <NumberExerciseParam
                        options={[KG]}
                        selected={KG.field}
                        value={
                          exercise.sets[index]?.[
                            core.exercise.param.pairs['loadKg']
                          ] || 0
                        }
                        exercise={exercise}
                        showOptions={false}
                        disableOptions
                        onInputChange={(_) => {}}
                      />
                    </Box>
                  )}

                  {effTempoParam ? (
                    <Box
                      width={widthParam}
                      display="flex"
                      justifyContent="center"
                    >
                      {effType === 'tempoEcc' ? (
                        <TempoExerciseParam
                          options={effOptions}
                          selected={effType}
                          value={core.training.set.getTempoR(
                            exercise.sets[index]
                          )}
                          exercise={exercise}
                          showOptions={false}
                          disableOptions
                          onInputChange={(_) => {}}
                        />
                      ) : (
                        <NumberExerciseParam
                          options={effOptions}
                          selected={effType}
                          value={
                            exercise.sets[index]?.[
                              core.exercise.param.pairs[effType]
                            ] || 0
                          }
                          exercise={exercise}
                          showOptions={false}
                          disableOptions
                          onInputChange={(_) => {}}
                        />
                      )}
                    </Box>
                  ) : null}

                  {recParam && (
                    <Box
                      width={widthParam}
                      display="flex"
                      justifyContent="center"
                    >
                      <NumberExerciseParam
                        options={recOptions}
                        selected={recType}
                        value={
                          exercise.sets[index][
                            core.exercise.param.pairs[recType]
                          ] || 0
                        }
                        exercise={exercise}
                        showOptions={false}
                        disableOptions
                        onInputChange={(_) => {}}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Grid2>

            <Grid2 size={0.5} display="flex" alignItems="flex-end"></Grid2>
          </Grid2>
        );
      })}
    </Box>
  );
}
