import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';
import { useEffect } from 'react';

import { NumberExerciseParam } from '@/components/exercise-param/number-exercise-param';
import { TempoExerciseParam } from '@/components/exercise-param/tempo-exercise-param';
import { core } from '@/core/core.service';
import {
  BW,
  DIST,
  EFF,
  KG,
  REC_DIST,
  REC_TIME,
  REPS,
  RM,
  SETS,
  TEMPO,
  TIME,
} from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
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

  // if unilateral, populate right side params with left side values if empty
  useEffect(() => {
    if (uni) {
      const newExercise = structuredClone(exercise);
      for (const s of newExercise.sets) {
        if (s && !s.repsR && s.reps) s.repsR = s.reps;
        if (s && !s.loadKgR && s.loadKg) s.loadKgR = s.loadKg;
        if (s && !s.loadRmR && s.loadRm) s.loadRmR = s.loadRm;
        if (s && !s.loadBwR && s.loadBw) s.loadBwR = s.loadBw;
        if (s && !s.tempoR && s.tempo) s.tempoR = s.tempo;
        if (s && !s.velR && s.vel) s.velR = s.vel;
      }

      supersetsContext.updateTrainingExercises([newExercise]);
    }
  }, [loadType, volType, effType, recType]);

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
          <NumberExerciseParam
            options={[SETS]}
            selected={SETS.field}
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

          <NumberExerciseParam
            options={[REPS, DIST, TIME]}
            selected={volType}
            value={exercise.sets[0]?.[volType] as number}
            showOptions
            exercise={exercise}
            disableOptions={!!selectedAthlete}
            onSelectChange={(selected) => {
              // update vol type
              const field = selected.toString() as typeof volType;
              const value = core.exercise.param.get(field)
                ?.defaultValue as number;

              // set new selected field to default value
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                field,
                value,
                undefined,
                { updateSubgroups: true }
              );

              if (uni)
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  core.exercise.param.pairs[field],
                  value,
                  undefined,
                  { updateSubgroups: true }
                );

              // make all other vol fields undefined
              (
                ['reps', 'dist', 'time', 'repsR'] as ExerciseParamField[]
              ).forEach((f) => {
                if (f !== field && core.exercise.param.pairs[field] !== f) {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    f,
                    undefined,
                    undefined,
                    { updateSubgroups: true }
                  );
                }
              });
            }}
            onInputChange={(value) => {
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                volType,
                +value
              );
            }}
          />

          <NumberExerciseParam
            options={[KG, RM, BW]}
            selected={loadType}
            value={exercise.sets[0]?.[loadType] as number}
            showOptions
            exercise={exercise}
            disableOptions={!!selectedAthlete}
            onSelectChange={(selected) => {
              // update load type
              const field = selected.toString() as typeof loadType;
              const value = core.exercise.param.get(field)
                ?.defaultValue as number;

              // set new selected field to default value
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                field,
                value,
                undefined,
                { updateSubgroups: true }
              );

              if (uni)
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  core.exercise.param.pairs[field],
                  value,
                  undefined,
                  { updateSubgroups: true }
                );

              // make all other load fields undefined
              (
                [
                  'loadKg',
                  'loadRm',
                  'loadBw',
                  'loadKgR',
                  'loadRmR',
                  'loadBwR',
                ] as ExerciseParamField[]
              ).forEach((f) => {
                if (f !== field && core.exercise.param.pairs[field] !== f) {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    f,
                    undefined,
                    undefined,
                    { updateSubgroups: true }
                  );
                }
              });
            }}
            onInputChange={(value) => {
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                loadType,
                +value
              );
            }}
          />

          {effType === 'tempo' ? (
            <TempoExerciseParam
              options={[TEMPO, EFF]}
              selected={effType}
              value={exercise.sets[0]?.[effType] || ''}
              showOptions
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onSelectChange={(selected) => {
                // update eff type
                const field = selected.toString() as typeof effType;
                const value = core.exercise.param.get(field)?.defaultValue as
                  | string
                  | number;

                // set new selected field to default value
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  field,
                  value,
                  undefined,
                  { updateSubgroups: true }
                );

                if (uni)
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    core.exercise.param.pairs[field],
                    value,
                    undefined,
                    { updateSubgroups: true }
                  );

                // make all other eff fields undefined
                (['tempo', 'eff', 'tempoR'] as ExerciseParamField[]).forEach(
                  (f) => {
                    if (f !== field && core.exercise.param.pairs[field] !== f) {
                      supersetsContext.updateTrainingExerciseParam(
                        exercise,
                        f,
                        undefined,
                        undefined,
                        { updateSubgroups: true }
                      );
                    }
                  }
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
              options={[TEMPO, EFF]}
              selected={effType}
              value={exercise.sets[0]?.[effType] || 0}
              showOptions
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onSelectChange={(selected) => {
                // update eff type
                const field = selected.toString() as typeof effType;
                const value = core.exercise.param.get(field)
                  ?.defaultValue as number;

                // set new selected field to default value
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  field,
                  value,
                  undefined,
                  { updateSubgroups: true }
                );

                if (uni)
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    core.exercise.param.pairs[field],
                    value,
                    undefined,
                    { updateSubgroups: true }
                  );

                // make all other eff fields undefined
                (['tempo', 'eff'] as ExerciseParamField[]).forEach((f) => {
                  if (f !== field && core.exercise.param.pairs[field] !== f) {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      f,
                      undefined,
                      undefined,
                      { updateSubgroups: true }
                    );
                  }
                });
              }}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  effType,
                  +value
                );
              }}
            />
          )}

          <NumberExerciseParam
            options={[REC_TIME, REC_DIST]}
            selected={recType}
            value={exercise.sets[0]?.[recType] || 0}
            showOptions
            exercise={exercise}
            disableOptions={!!selectedAthlete}
            onSelectChange={(selected) => {
              // update rec type
              const field = selected.toString() as typeof recType;
              const value = core.exercise.param.get(field)
                ?.defaultValue as number;

              // set new selected field to default value
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                field,
                value,
                undefined,
                { updateSubgroups: true }
              );

              if (uni)
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  core.exercise.param.pairs[field],
                  value,
                  undefined,
                  { updateSubgroups: true }
                );

              // make all other rec fields undefined
              (['recTime', 'recDist'] as ExerciseParamField[]).forEach((f) => {
                if (f !== field) {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    f,
                    undefined,
                    undefined,
                    { updateSubgroups: true }
                  );
                }
              });
            }}
            onInputChange={(value) => {
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                recType,
                +value
              );
            }}
          />
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
              selected={SETS.field}
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

            <NumberExerciseParam
              options={[REPS, DIST, TIME]}
              selected={volType}
              value={
                volType === 'reps'
                  ? exercise.sets[0]?.repsR || 0
                  : exercise.sets[0]?.[volType] || 0 // dist and time are the same for both sides
              }
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onInputChange={(value) => {
                const field = volType === 'reps' ? 'repsR' : volType;
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  field,
                  +value
                );
              }}
            />

            <NumberExerciseParam
              options={[KG, RM, BW]}
              selected={loadType}
              value={exercise.sets[0]?.[loadType] as number}
              showOptions
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onSelectChange={(selected) => {
                // update load type
                const field = selected.toString() as typeof loadType;
                const value = core.exercise.param.get(field)
                  ?.defaultValue as number;

                // set new selected field to default value
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  field,
                  value,
                  undefined,
                  { updateSubgroups: true }
                );

                if (uni)
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    core.exercise.param.pairs[field],
                    value,
                    undefined,
                    { updateSubgroups: true }
                  );

                // make all other load fields undefined
                (
                  [
                    'loadKg',
                    'loadRm',
                    'loadBw',
                    'loadKgR',
                    'loadRmR',
                    'loadBwR',
                  ] as ExerciseParamField[]
                ).forEach((f) => {
                  if (f !== field && core.exercise.param.pairs[field] !== f) {
                    supersetsContext.updateTrainingExerciseParam(
                      exercise,
                      f,
                      undefined,
                      undefined,
                      { updateSubgroups: true }
                    );
                  }
                });
              }}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  loadType,
                  +value
                );
              }}
            />

            {effType === 'tempo' ? (
              <TempoExerciseParam
                options={[TEMPO, EFF]}
                selected={effType}
                value={exercise.sets[0]?.tempoR || ''}
                showOptions={false}
                exercise={exercise}
                disableOptions={!!selectedAthlete}
                onInputChange={(value) => {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    'tempoR',
                    value.toString()
                  );
                }}
              />
            ) : (
              <NumberExerciseParam
                options={[TEMPO, EFF]}
                selected={effType}
                value={exercise.sets[0]?.eff || 0}
                showOptions={false}
                exercise={exercise}
                disableOptions={!!selectedAthlete}
                onInputChange={(value) => {
                  supersetsContext.updateTrainingExerciseParam(
                    exercise,
                    'eff',
                    +value
                  );
                }}
              />
            )}

            <NumberExerciseParam
              options={[REC_TIME, REC_DIST]}
              selected={recType}
              value={
                recType === 'recTime'
                  ? exercise.sets[0]?.recTime || 0
                  : exercise.sets[0]?.recDist || 0
              }
              showOptions={false}
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  recType,
                  +value
                );
              }}
            />
          </Box>
        )}
      </Grid2>
    </Grid2>
  );
}
