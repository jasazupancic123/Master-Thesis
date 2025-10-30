import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';

import { NumberExerciseParam } from '@/components/exercise-param/number-exercise-param';
import { TempoExerciseParam } from '@/components/exercise-param/tempo-exercise-param';
import { core } from '@/core/core.service';
import { SETS } from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseParamFieldExtended } from '@/core/training/type/exercise-set.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

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
  const trainerDayViewContext = useTrainerDayView();
  const supersetsContext = useSupersets();

  const { training, component, selectedAthlete } = trainerDayViewContext;
  const { exercise, expandedSetsView, setExpandedSetsView, componentIndex } =
    props;

  const uni = exercise.exercise?.isUnilateral;
  const loadType = core.training.set.getLoadType(exercise.sets[0]);
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);

  const volOptions = core.training.set.getVolOptions(exercise.exercise!);
  const recOptions = core.training.set.getRecOptions(exercise.exercise!);
  const intOptions = core.training.set.getIntOptions(exercise.exercise!);
  const effOptions = core.training.set.getEffOptions(exercise.exercise!);

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
            sx={{ p: 0, m: 0 }}
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
            {uni ? (
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

      <Grid2 size={10} spacing={10}>
        <Box
          key={exercise.id}
          width="100%"
          display="flex"
          flexDirection="column"
          gap={2}
          minHeight={80}
        >
          <Box
            display="flex"
            width="100%"
            justifyContent="center"
            alignItems={'flex-start'}
            gap={1}
            sx={{ height: 77 }}
          >
            <NumberExerciseParam
              options={[SETS]}
              selected={SETS.field as string}
              value={exercise.sets.length}
              showOptions
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  'sets',
                  +value
                );
              }}
            />

            {volType && volOptions.length > 0 && (
              <NumberExerciseParam
                options={volOptions}
                selected={volType}
                value={exercise.sets[0]?.[volType] as number}
                showOptions
                exercise={exercise}
                disableOptions={!!selectedAthlete}
                onSelectChange={(selected) => {
                  // update vol type
                  const field = selected.toString() as typeof volType;
                  const pair = core.exercise.param.pairs[field];
                  const value = core.exercise.param.get(field)
                    ?.defaultValue as number;

                  supersetsContext.updateTrainingExerciseParams(
                    exercise,
                    [
                      // update param with new value
                      { field, value, setIndex: undefined },
                      // update its pair
                      ...(uni
                        ? [{ field: pair, value, setIndex: undefined }]
                        : []),
                      // clear other vol params
                      ...['reps', 'dist', 'time', 'repsR']
                        .filter((f) => f !== field && f !== pair)
                        .map((f) => ({
                          field: f as ExerciseParamFieldExtended,
                          value: undefined,
                          setIndex: undefined,
                        })),
                    ],
                    { updateSubgroups: true, updateWholePair: true }
                  );
                }}
                onInputChange={(value) => {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    volType,
                    +value
                  );
                }}
              />
            )}

            {loadType && intOptions.length > 0 && (
              <NumberExerciseParam
                options={intOptions}
                selected={loadType}
                value={exercise.sets[0]?.[loadType] as number}
                showOptions
                exercise={exercise}
                disableOptions={!!selectedAthlete}
                onSelectChange={(selected) => {
                  // update load type
                  const field = selected.toString() as typeof loadType;
                  const pair = core.exercise.param.pairs[field];
                  const value = core.exercise.param.get(field)
                    ?.defaultValue as number;

                  supersetsContext.updateTrainingExerciseParams(
                    exercise,
                    [
                      // update param with new value
                      { field, value, setIndex: undefined },
                      // update its pair
                      ...(uni
                        ? [{ field: pair, value, setIndex: undefined }]
                        : []),
                      // clear other load params
                      ...[
                        'loadKg',
                        'loadRm',
                        'loadBw',
                        'loadKgR',
                        'loadRmR',
                        'loadBwR',
                      ]
                        .filter((f) => f !== field && pair !== f)
                        .map((f) => ({
                          field: f as ExerciseParamFieldExtended,
                          value: undefined,
                          setIndex: undefined,
                        })),
                    ],
                    { updateSubgroups: true, updateWholePair: true }
                  );
                }}
                onInputChange={(value) => {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    loadType,
                    +value
                  );
                }}
              />
            )}

            {effType && effOptions.length > 0 ? (
              effType === 'tempo' ? (
                <TempoExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={exercise.sets[0]?.[effType] || ''}
                  showOptions
                  exercise={exercise}
                  disableOptions={!!selectedAthlete}
                  onSelectChange={(selected) => {
                    // update eff type
                    const field = selected.toString() as typeof effType;
                    const pair = core.exercise.param.pairs[field];
                    const value = core.exercise.param.get(field)
                      ?.defaultValue as number;

                    supersetsContext.updateTrainingExerciseParams(
                      exercise,
                      [
                        // update param with new value
                        { field, value, setIndex: undefined },
                        // update its pair
                        ...(uni
                          ? [{ field: pair, value, setIndex: undefined }]
                          : []),
                        // clear other eff params
                        ...['tempo', 'eff', 'tempoR']
                          .filter((f) => f !== field && f !== pair)
                          .map((f) => ({
                            field: f as ExerciseParamFieldExtended,
                            value: undefined,
                            setIndex: undefined,
                          })),
                      ],
                      { updateSubgroups: true, updateWholePair: true }
                    );
                  }}
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      effType,
                      value.toString()
                    );
                  }}
                />
              ) : (
                <NumberExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={exercise.sets[0]?.[effType] || 0}
                  showOptions
                  exercise={exercise}
                  disableOptions={!!selectedAthlete}
                  onSelectChange={(selected) => {
                    // update eff type
                    const field = selected.toString() as typeof effType;
                    const pair = core.exercise.param.pairs[field];
                    const value = core.exercise.param.get(field)
                      ?.defaultValue as string;

                    supersetsContext.updateTrainingExerciseParams(
                      exercise,
                      [
                        // update param with new value
                        { field, value, setIndex: undefined },
                        // update its pair
                        ...(uni
                          ? [{ field: pair, value, setIndex: undefined }]
                          : []),
                        // clear other eff params
                        ...['tempo', 'eff', 'tempoR']
                          .filter((f) => f !== field && f !== pair)
                          .map((f) => ({
                            field: f as ExerciseParamFieldExtended,
                            value: undefined,
                            setIndex: undefined,
                          })),
                      ],
                      { updateSubgroups: true, updateWholePair: true }
                    );
                  }}
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      effType,
                      +value
                    );
                  }}
                />
              )
            ) : null}

            {recType && recOptions.length > 0 && (
              <NumberExerciseParam
                options={recOptions}
                selected={recType}
                value={exercise.sets[0]?.[recType] || 0}
                showOptions
                exercise={exercise}
                disableOptions={!!selectedAthlete}
                onSelectChange={(selected) => {
                  // update rec type
                  const field = selected.toString() as typeof recType;
                  const pair = core.exercise.param.pairs[field];
                  const value = core.exercise.param.get(field)
                    ?.defaultValue as number;

                  supersetsContext.updateTrainingExerciseParams(
                    exercise,
                    [
                      // update param with new value
                      { field, value, setIndex: undefined },
                      // update its pair
                      ...(uni
                        ? [{ field: pair, value, setIndex: undefined }]
                        : []),
                      // clear other rec params
                      ...['recTime', 'recDist']
                        .filter((f) => f !== field && f !== pair)
                        .map((f) => ({
                          field: f as ExerciseParamFieldExtended,
                          value: undefined,
                          setIndex: undefined,
                        })),
                    ],
                    { updateSubgroups: true, updateWholePair: true }
                  );
                }}
                onInputChange={(value) => {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    recType,
                    +value
                  );
                }}
              />
            )}
          </Box>

          {/* Show secondary side if unilateral exercise */}
          {uni && (
            <Box
              display="flex"
              width="100%"
              justifyContent="center"
              alignItems={uni ? 'center' : 'flex-start'}
              gap={1}
              mt={-5}
            >
              <NumberExerciseParam
                options={[SETS]}
                selected={SETS.field as string}
                value={exercise.sets.length}
                showOptions={false}
                exercise={exercise}
                disableOptions={!!selectedAthlete}
                onInputChange={(value) => {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    'sets',
                    +value
                  );
                }}
              />

              {volType && volOptions.length > 0 && (
                <NumberExerciseParam
                  options={volOptions}
                  selected={volType}
                  value={
                    exercise.sets[0]?.[core.exercise.param.pairs[volType]] || 0
                  }
                  exercise={exercise}
                  showOptions={false}
                  disableOptions={!!selectedAthlete}
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      core.exercise.param.pairs[volType],
                      +value
                    );
                  }}
                />
              )}

              {loadType && intOptions.length > 0 && (
                <NumberExerciseParam
                  options={intOptions}
                  selected={loadType}
                  value={
                    exercise.sets[0]?.[core.exercise.param.pairs[loadType]] || 0
                  }
                  exercise={exercise}
                  showOptions={false}
                  disableOptions={!!selectedAthlete}
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      core.exercise.param.pairs[loadType],
                      +value
                    );
                  }}
                />
              )}

              {effType && effOptions.length > 0 ? (
                effType === 'tempo' ? (
                  <TempoExerciseParam
                    options={effOptions}
                    selected={effType}
                    value={
                      exercise.sets[0]?.[core.exercise.param.pairs[effType]] ||
                      ''
                    }
                    showOptions={false}
                    exercise={exercise}
                    disableOptions={!!selectedAthlete}
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        core.exercise.param.pairs[effType],
                        value.toString()
                      );
                    }}
                  />
                ) : (
                  <NumberExerciseParam
                    options={effOptions}
                    selected={effType}
                    value={
                      exercise.sets[0]?.[core.exercise.param.pairs[effType]] ||
                      0
                    }
                    showOptions={false}
                    exercise={exercise}
                    disableOptions={!!selectedAthlete}
                    onInputChange={(value) => {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        core.exercise.param.pairs[effType],
                        +value
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
                    exercise.sets[0]?.[core.exercise.param.pairs[recType]] || 0
                  }
                  showOptions={false}
                  exercise={exercise}
                  disableOptions={!!selectedAthlete}
                  onInputChange={(value) => {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      core.exercise.param.pairs[recType],
                      +value
                    );
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Grid2>
    </Grid2>
  );
}
