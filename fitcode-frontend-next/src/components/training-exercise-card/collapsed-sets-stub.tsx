import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';

import type { TrainingExerciseCardCollapsedSetsProps } from './collapsed-sets';
import { NumberExerciseParam } from '@/components/exercise-param/number-exercise-param';
import { TempoExerciseParam } from '@/components/exercise-param/tempo-exercise-param';
import { core } from '@/core/core.service';
import { SETS } from '@/core/exercise/constant/exercise-param.constant';
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

  const volOptions = core.training.set.getVolOptions(exercise.exercise!);
  const intOptions = core.training.set.getIntOptions(exercise.exercise!);
  const effOptions = core.training.set.getEffOptions(exercise.exercise!);
  const recOptions = core.training.set.getRecOptions(exercise.exercise!);

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
            selected={SETS.field as string}
            value={exercise.sets.length}
            exercise={exercise}
            showOptions
          />

          {volType && volOptions.length > 0 && (
            <NumberExerciseParam
              options={volOptions}
              selected={volType}
              value={exercise.sets[0]?.[volType] as number}
              showOptions
              exercise={exercise}
            />
          )}

          {loadType && intOptions.length > 0 && (
            <NumberExerciseParam
              options={intOptions}
              selected={loadType}
              value={exercise.sets[0]?.[loadType] as number}
              exercise={exercise}
              showOptions
            />
          )}

          {effType && effOptions.length > 0 ? (
            effType === 'tempo' ? (
              <TempoExerciseParam
                options={effOptions}
                selected={effType}
                value={exercise.sets[0]?.[effType] || ''}
                exercise={exercise}
                showOptions
              />
            ) : (
              <NumberExerciseParam
                options={effOptions}
                selected={effType}
                value={exercise.sets[0]?.[effType] || 0}
                exercise={exercise}
                showOptions
              />
            )
          ) : null}

          {recType && recOptions.length > 0 && (
            <NumberExerciseParam
              options={recOptions}
              selected={recType}
              value={exercise.sets[0]?.[recType] || 0}
              exercise={exercise}
              showOptions
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
            sx={{ height: 77 }}
          >
            <NumberExerciseParam
              options={[SETS]}
              selected={SETS.field as string}
              value={exercise.sets.length}
              exercise={exercise}
              showOptions={false}
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
              />
            )}

            {loadType && intOptions.length > 0 && (
              <NumberExerciseParam
                options={intOptions}
                selected={loadType}
                value={
                  exercise.sets[0]?.[core.exercise.param.pairs[loadType]] || 0
                }
                showOptions={false}
                exercise={exercise}
              />
            )}

            {effType && effOptions.length > 0 ? (
              effType === 'tempo' ? (
                <TempoExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={
                    exercise.sets[0]?.[core.exercise.param.pairs[effType]] || ''
                  }
                  showOptions={false}
                  exercise={exercise}
                />
              ) : (
                <NumberExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={
                    exercise.sets[0]?.[core.exercise.param.pairs[effType]] || 0
                  }
                  showOptions={false}
                  exercise={exercise}
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
              />
            )}
          </Box>
        )}
      </Grid2>
    </Grid2>
  );
}
