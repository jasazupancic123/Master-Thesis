import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';
import toast from 'react-hot-toast';

import { ExerciseParam } from '../exercise-param/exercise-param';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import { getLAndRValues } from '../training-exercise-card/state';
import type { TrainingExerciseCardCollapsedSetsProps } from './training-exercise-card-collapsed-sets';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

export default function StubTrainingExerciseCardCollapsedSets(
  props: TrainingExerciseCardCollapsedSetsProps
) {
  const screenSize = useScreenSize();

  const { exercise, expandedSetsView, setExpandedSetsView, componentIndex } =
    props;

  const { training, component, selectedAthlete, selectedAthleteWorkloads } =
    useTrainerDayViewContext();

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
            {exercise.exercise?.isBilateral ? (
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
          key={exercise.id}
          display="flex"
          width="100%"
          justifyContent="center"
          alignItems={exercise.exercise?.isBilateral ? 'center' : 'flex-start'}
          gap={1}
          sx={{
            height: 77,
          }}
        >
          {Array.isArray(exercise.params) &&
            exercise.params.map((param, i) => {
              /* find the custom workload for the selected athlete if selected, otherwise
                get the value from the exercise sets */

              const { valueL, valueR } = getLAndRValues(
                {
                  set: exercise.sets[0],
                  param,
                  setIndex: 0,
                  paramIndex: i - 1,
                },
                {
                  training,
                  exercise,
                  selectedAthleteWorkloads,
                  selectedAthlete,
                }
              );

              if (!valueL || (exercise.exercise?.isBilateral && !valueR)) {
                toast.error(`Invalid parameter field: ${param.field}`);
                return null;
              }

              return (
                <Box
                  key={param.field}
                  flexBasis={(100 / exercise.params.length).toString() + '%'}
                >
                  {['L', ...(exercise.exercise?.isBilateral ? ['R'] : [])].map(
                    (lOrR) => {
                      return (
                        <ExerciseParam
                          key={`${param.field}-${lOrR}`}
                          param={param}
                          value={
                            param.field === ParamType.VolWorkSets
                              ? lOrR === 'L'
                                ? ({
                                    field: valueL.field,
                                    selected: valueL.selected,
                                    value: '1',
                                  } as AttributeValue)
                                : valueR
                                  ? ({
                                      field: valueR.field,
                                      selected: valueR.selected,
                                      value: '1',
                                    } as AttributeValue)
                                  : undefined
                              : lOrR === 'L'
                                ? valueL
                                : valueR || undefined
                          }
                          showOptions={lOrR === 'L'}
                          exercise={exercise}
                          setsNumbers={[]}
                          setSetsNumbers={() => {}}
                          min={0}
                          max={0}
                          onOptionChange={() => {}}
                          onSubOptionChange={() => {}}
                        />
                      );
                    }
                  )}
                </Box>
              );
            })}
        </Box>
      </Grid2>
    </Grid2>
  );
}
