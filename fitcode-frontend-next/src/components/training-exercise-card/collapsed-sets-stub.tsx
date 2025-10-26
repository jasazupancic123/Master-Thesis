import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';

import type { TrainingExerciseCardCollapsedSetsProps } from './collapsed-sets';
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
import { useScreenSize } from '@/store/screen-size.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

export default function StubTrainingExerciseCardCollapsedSets(
  props: TrainingExerciseCardCollapsedSetsProps
) {
  const screenSize = useScreenSize();
  const { exercise, expandedSetsView, setExpandedSetsView, componentIndex } =
    props;

  const uni = exercise.exercise?.isUnilateral;
  const loadType = core.training.set.getLoadType(exercise.sets[0]);
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);

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
            exercise={exercise}
            showOptions
          />

          <NumberExerciseParam
            options={[REPS, DIST, TIME]}
            selected={volType}
            value={exercise.sets[0]?.[volType] as number}
            showOptions
            exercise={exercise}
          />

          <NumberExerciseParam
            options={[KG, RM, BW]}
            selected={loadType}
            value={exercise.sets[0]?.[loadType] as number}
            exercise={exercise}
            showOptions
          />

          {effType === 'tempo' ? (
            <TempoExerciseParam
              options={[TEMPO, EFF]}
              selected={effType}
              value={exercise.sets[0]?.[effType] || ''}
              exercise={exercise}
              showOptions
            />
          ) : (
            <NumberExerciseParam
              options={[TEMPO, EFF]}
              selected={effType}
              value={exercise.sets[0]?.[effType] || 0}
              exercise={exercise}
              showOptions
            />
          )}

          <NumberExerciseParam
            options={[REC_TIME, REC_DIST]}
            selected={recType}
            value={exercise.sets[0]?.[recType] || 0}
            exercise={exercise}
            showOptions
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
              showOptions={false}
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
            />

            {effType === 'tempo' ? (
              <TempoExerciseParam
                options={[TEMPO, EFF]}
                selected={effType}
                value={exercise.sets[0]?.tempoR || ''}
                showOptions={false}
                exercise={exercise}
              />
            ) : (
              <NumberExerciseParam
                options={[TEMPO, EFF]}
                selected={effType}
                value={exercise.sets[0]?.eff || 0}
                showOptions={false}
                exercise={exercise}
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
            />
          </Box>
        )}
      </Grid2>
    </Grid2>
  );
}
