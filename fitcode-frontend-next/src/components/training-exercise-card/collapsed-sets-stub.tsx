import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';

import type { TrainingExerciseCardCollapsedSetsProps } from './collapsed-sets';
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
import { useScreenSize } from '@/store/screen-size.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

export default function StubTrainingExerciseCardCollapsedSets(
  props: TrainingExerciseCardCollapsedSetsProps
) {
  const screenSize = useScreenSize();
  const { exercise, expandedSetsView, setExpandedSetsView, componentIndex } =
    props;

  const uni = exercise.exercise?.isUnilateral;
  const loadType = exercise.sets[0]?.loadType || LoadType.Kg;

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
            options={[REPS]}
            selected={REPS.field}
            value={exercise.sets[0]?.reps}
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

          <TempoExerciseParam
            options={[TEMPO]}
            selected={TEMPO.field}
            value={exercise.sets[0]?.tempo || ''}
            exercise={exercise}
            showOptions
          />

          <NumberExerciseParam
            options={[REC_TIME]}
            selected={REC_TIME.field}
            value={exercise.sets[0].recTime}
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
              options={[REPS]}
              selected={REPS.field}
              value={exercise.sets[0]?.repsR || exercise.sets[0]?.reps}
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

            <TempoExerciseParam
              options={[TEMPO]}
              selected={TEMPO.field}
              value={exercise.sets[0]?.tempoR || exercise.sets[0]?.tempo || ''}
              showOptions={false}
              exercise={exercise}
            />

            <NumberExerciseParam
              options={[REC_TIME]}
              selected={REC_TIME.field}
              value={exercise.sets[0].recTime}
              showOptions={false}
              exercise={exercise}
            />
          </Box>
        )}
      </Grid2>
    </Grid2>
  );
}
