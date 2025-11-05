import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';

import { NumberExerciseParam } from '@/components/exercise-param/number-exercise-param';
import { TempoExerciseParam } from '@/components/exercise-param/tempo-exercise-param';
import { core } from '@/core/core.service';
import { SETS } from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
  component: TrainingComponent;
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  supersetIndex: number;
}

export default function TrainingExerciseCardExpandedSets({
  exercise,
  expandedSetsView,
  setExpandedSetsView,
}: Props) {
  const screenSize = useScreenSize();
  const trainerDayViewContext = useTrainerDayView();
  const supersetsContext = useSupersets();

  const { training, component } = trainerDayViewContext;

  const uni = exercise.exercise?.isUnilateral;
  const loadType = core.training.set.getLoadType(exercise.sets[0]);
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);

  const volOptions = core.training.set.getVolOptions(exercise.exercise!);
  const intOptions = core.training.set.getIntOptions(exercise.exercise!);
  const effOptions = core.training.set.getEffOptions(exercise.exercise!);
  const recOptions = core.training.set.getRecOptions(exercise.exercise!);

  if (!training || !component) return null;

  return (
    <Box display="flex" flexDirection="column" width="100%" gap={0.9}>
      {/* Expanded sets view */}
      {exercise.sets.map((set, setIndex) => {
        return (
          <Grid2
            container
            spacing={1}
            columns={11}
            key={setIndex}
            px={screenSize.isSmallerThanLaptop ? 1 : 0}
          >
            <Grid2 size={1}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.9}
                mt={setIndex === 0 ? 0.9 : 0.5}
              >
                {setIndex === 0 && (
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
                  gap={0.8}
                >
                  {uni ? (
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
                <NumberExerciseParam
                  options={[SETS]}
                  selected={SETS.field as string}
                  value={set.setNumber}
                  exercise={exercise}
                  showOptions={setIndex === 0}
                  disable
                  disableOptions
                />

                {volType && volOptions.length > 0 && (
                  <NumberExerciseParam
                    options={volOptions}
                    selected={volType}
                    value={exercise.sets[setIndex]?.[volType] as number}
                    exercise={exercise}
                    showOptions={setIndex === 0}
                    disableOptions
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        volType,
                        +value,
                        setIndex
                      );
                    }}
                  />
                )}

                {loadType && intOptions.length > 0 && (
                  <NumberExerciseParam
                    options={intOptions}
                    selected={loadType}
                    value={exercise.sets[setIndex]?.[loadType] as number}
                    exercise={exercise}
                    showOptions={setIndex === 0}
                    disableOptions
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        loadType,
                        +value,
                        setIndex
                      );
                    }}
                  />
                )}

                {effType && effOptions.length > 0 ? (
                  effType === 'tempoEcc' ? (
                    <TempoExerciseParam
                      options={effOptions}
                      selected={effType}
                      value={core.training.set.getTempo(
                        exercise.sets[setIndex]
                      )}
                      exercise={exercise}
                      showOptions={setIndex === 0}
                      disableOptions
                      onInputChange={(value) => {
                        supersetsContext.updateTrainingExerciseParam(
                          exercise,
                          effType,
                          value.toString(),
                          setIndex
                        );
                      }}
                    />
                  ) : (
                    <NumberExerciseParam
                      options={effOptions}
                      selected={effType}
                      value={exercise.sets[setIndex]?.[effType] || 0}
                      exercise={exercise}
                      showOptions={setIndex === 0}
                      disableOptions
                      onInputChange={(value) => {
                        supersetsContext.updateTrainingExerciseParam(
                          exercise,
                          effType,
                          +value,
                          setIndex
                        );
                      }}
                    />
                  )
                ) : null}

                {recType && recOptions.length > 0 && (
                  <NumberExerciseParam
                    options={recOptions}
                    selected={recType}
                    value={exercise.sets[setIndex]?.[recType] || 0}
                    exercise={exercise}
                    showOptions={setIndex === 0}
                    disableOptions
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        recType,
                        +value,
                        setIndex
                      );
                    }}
                  />
                )}
              </Box>

              {uni && (
                <Box
                  display="flex"
                  width="100%"
                  justifyContent="center"
                  alignItems="center"
                  gap={1}
                >
                  <NumberExerciseParam
                    options={[SETS]}
                    selected={SETS.field as string}
                    value={set.setNumber}
                    exercise={exercise}
                    showOptions={false}
                    disable
                  />

                  {volType && volOptions.length > 0 && (
                    <NumberExerciseParam
                      options={volOptions}
                      selected={volType}
                      value={
                        exercise.sets[setIndex]?.[
                          core.exercise.param.pairs[volType]
                        ] || 0
                      }
                      exercise={exercise}
                      showOptions={false}
                      onInputChange={(value) => {
                        supersetsContext.updateTrainingExerciseParam(
                          exercise,
                          core.exercise.param.pairs[volType],
                          +value,
                          setIndex
                        );
                      }}
                    />
                  )}

                  {loadType && intOptions.length > 0 && (
                    <NumberExerciseParam
                      options={intOptions}
                      selected={loadType}
                      value={
                        exercise.sets[setIndex]?.[
                          core.exercise.param.pairs[loadType]
                        ] || 0
                      }
                      showOptions={false}
                      exercise={exercise}
                      disableOptions
                      onInputChange={(value) => {
                        supersetsContext.updateTrainingExerciseParam(
                          exercise,
                          core.exercise.param.pairs[loadType],
                          +value,
                          setIndex
                        );
                      }}
                    />
                  )}

                  {effType && effOptions.length > 0 ? (
                    effType === 'tempoEcc' ? (
                      <TempoExerciseParam
                        options={effOptions}
                        selected={effType}
                        value={core.training.set.getTempo(
                          exercise.sets[setIndex]
                        )}
                        showOptions={false}
                        exercise={exercise}
                        disableOptions
                        onInputChange={(values) => {
                          const tempo = values as [
                            number,
                            number,
                            number,
                            number,
                          ];

                          supersetsContext.updateTrainingExerciseParams(
                            exercise,
                            (
                              [
                                'tempoEcc',
                                'tempoIso',
                                'tempoCon',
                                'tempoIdle',
                              ] as ExerciseParamField[]
                            ).map((field, i) => ({
                              field,
                              value: tempo[i],
                              setIndex,
                            }))
                          );
                        }}
                      />
                    ) : (
                      <NumberExerciseParam
                        options={effOptions}
                        selected="eff"
                        value={
                          exercise.sets[setIndex]?.[
                            core.exercise.param.pairs[effType]
                          ] || 0
                        }
                        showOptions={false}
                        exercise={exercise}
                        disableOptions
                        onInputChange={(value) => {
                          supersetsContext.updateTrainingExerciseParam(
                            exercise,
                            core.exercise.param.pairs[effType],
                            +value,
                            setIndex
                          );
                        }}
                      />
                    )
                  ) : null}

                  {recType && recOptions.length > 0 && (
                    <NumberExerciseParam
                      options={recOptions}
                      selected={recType}
                      value={
                        exercise.sets[setIndex]?.[
                          core.exercise.param.pairs[recType]
                        ] || 0
                      }
                      showOptions={false}
                      exercise={exercise}
                      disableOptions
                      onInputChange={(value) => {
                        supersetsContext.updateTrainingExerciseParam(
                          exercise,
                          core.exercise.param.pairs[recType],
                          +value,
                          setIndex
                        );
                      }}
                    />
                  )}
                </Box>
              )}
            </Grid2>
          </Grid2>
        );
      })}
    </Box>
  );
}
