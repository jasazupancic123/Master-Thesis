import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';

import { NumberExerciseParam } from '@/components/exercise-param/number-exercise-param';
import { TempoExerciseParam } from '@/components/exercise-param/tempo-exercise-param';
import {
  BW,
  KG,
  REC_TIME,
  REPS,
  RM,
  SETS,
  TEMPO,
} from '@/core/exercise/constant/exercise-param.constant';
import { LoadType } from '@/core/training/enum/load-type.enum';
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
  const loadType = exercise.sets[0]?.loadType || LoadType.Kg;

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
                  selected={SETS.field}
                  value={set.setNumber}
                  exercise={exercise}
                  showOptions={setIndex === 0}
                  disable
                  disableOptions
                />

                <NumberExerciseParam
                  options={[REPS]}
                  selected={REPS.field}
                  value={exercise.sets[setIndex]?.reps}
                  exercise={exercise}
                  showOptions={setIndex === 0}
                  disableOptions
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      'reps',
                      +value,
                      setIndex
                    );
                  }}
                />

                <NumberExerciseParam
                  options={[KG, RM, BW]}
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

                <TempoExerciseParam
                  options={[TEMPO]}
                  selected={TEMPO.field}
                  value={exercise.sets[setIndex]?.tempo || ''}
                  exercise={exercise}
                  showOptions={setIndex === 0}
                  disableOptions
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      'tempo',
                      value.toString(),
                      setIndex
                    );
                  }}
                />

                <NumberExerciseParam
                  options={[REC_TIME]}
                  selected={REC_TIME.field}
                  value={exercise.sets[setIndex].recTime}
                  exercise={exercise}
                  showOptions={setIndex === 0}
                  disableOptions
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      'recTime',
                      +value,
                      setIndex
                    );
                  }}
                />
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
                    selected={SETS.field}
                    value={set.setNumber}
                    exercise={exercise}
                    showOptions={false}
                    disable
                  />

                  <NumberExerciseParam
                    options={[REPS]}
                    selected={REPS.field}
                    value={
                      exercise.sets[setIndex]?.repsR ||
                      exercise.sets[setIndex]?.reps
                    }
                    exercise={exercise}
                    showOptions={false}
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        'repsR',
                        +value,
                        setIndex
                      );
                    }}
                  />

                  <NumberExerciseParam
                    options={[KG, RM, BW]}
                    selected={loadType}
                    value={
                      exercise.sets[setIndex]?.[`${loadType}R`] ||
                      exercise.sets[setIndex]?.[loadType] ||
                      0
                    }
                    showOptions={false}
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        `${loadType}R`,
                        +value,
                        setIndex
                      );
                    }}
                  />

                  <TempoExerciseParam
                    options={[TEMPO]}
                    selected={TEMPO.field}
                    value={
                      exercise.sets[setIndex]?.tempoR ||
                      exercise.sets[setIndex]?.tempo ||
                      ''
                    }
                    showOptions={false}
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        'tempoR',
                        value.toString(),
                        setIndex
                      );
                    }}
                  />

                  <NumberExerciseParam
                    options={[REC_TIME]}
                    selected={REC_TIME.field}
                    value={exercise.sets[setIndex].recTime}
                    showOptions={false}
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        'recTime',
                        +value,
                        setIndex
                      );
                    }}
                  />
                </Box>
              )}
            </Grid2>
          </Grid2>
        );
      })}
    </Box>
  );
}
