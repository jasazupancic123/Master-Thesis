import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';
import { useEffect } from 'react';

import { NumberExerciseParam } from '@/components/exercise-param/number-exercise-param';
import { TempoExerciseParam } from '@/components/exercise-param/tempo-exercise-param';
import { core } from '@/core/core.service';
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
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import LeftRightExerciseText from '@/util/left-right-exercise-text';

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
  const loadType = exercise.sets[0]?.loadType || LoadType.Kg;

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
  }, [uni]);

  if (!training || !component) return null;

  return (
    <Grid2
      key={componentIndex}
      container
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

          <Box display="flex" flexDirection="column" gap={0.8}>
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

      <Grid2 size={10} mt={uni ? -1.5 : 0}>
        <Box
          display="flex"
          width="100%"
          justifyContent="center"
          alignItems={uni ? 'center' : 'flex-start'}
          gap={1}
          sx={{ height: 77 }}
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
            options={[REPS]}
            selected={REPS.field}
            value={exercise.sets[0]?.reps}
            showOptions
            exercise={exercise}
            disableOptions={!!selectedAthlete}
            onInputChange={(value) => {
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                'reps',
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
              const field = selected.toString() as LoadType;
              const value = core.exercise.param.get(field)
                ?.defaultValue as number;

              supersetsContext.updateTrainingExerciseParam(
                exercise,
                'loadType' as ExerciseParamField,
                field
              );

              supersetsContext.updateTrainingExerciseParam(
                exercise,
                field,
                value
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

          <TempoExerciseParam
            options={[TEMPO]}
            selected={TEMPO.field}
            value={exercise.sets[0]?.tempo || ''}
            showOptions
            exercise={exercise}
            disableOptions={!!selectedAthlete}
            onInputChange={(value) => {
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                'tempo',
                value.toString()
              );
            }}
          />

          <NumberExerciseParam
            options={[REC_TIME]}
            selected={REC_TIME.field}
            value={exercise.sets[0].recTime}
            showOptions
            exercise={exercise}
            disableOptions={!!selectedAthlete}
            onInputChange={(value) => {
              supersetsContext.updateTrainingExerciseParam(
                exercise,
                'recTime',
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
            sx={{ height: 77 }}
          >
            <NumberExerciseParam
              options={[SETS]}
              selected={SETS.field}
              value={exercise.sets.length}
              exercise={exercise}
              showOptions={false}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  'sets',
                  +value
                );
              }}
            />

            <NumberExerciseParam
              options={[REPS]}
              selected={REPS.field}
              value={exercise.sets[0]?.repsR || exercise.sets[0]?.reps}
              exercise={exercise}
              showOptions={false}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  'repsR',
                  +value
                );
              }}
            />

            <NumberExerciseParam
              options={[KG, RM, BW]}
              selected={loadType}
              value={
                exercise.sets[0]?.[`${loadType}R`] ||
                exercise.sets[0]?.[loadType] ||
                0
              }
              showOptions={false}
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  `${loadType}R`,
                  +value
                );
              }}
            />

            <TempoExerciseParam
              options={[TEMPO]}
              selected={TEMPO.field}
              value={exercise.sets[0]?.tempoR || exercise.sets[0]?.tempo || ''}
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

            <NumberExerciseParam
              options={[REC_TIME]}
              selected={REC_TIME.field}
              value={exercise.sets[0].recTime}
              showOptions={false}
              exercise={exercise}
              disableOptions={!!selectedAthlete}
              onInputChange={(value) => {
                supersetsContext.updateTrainingExerciseParam(
                  exercise,
                  'recTime',
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
