import { useGroup } from '@/context/group-provider';
import {
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import TrainingWeek from '../training-cycle-view-week/training-week';
import dayjs from 'dayjs';
import { ArrowDropDown, ArrowDropUp, Info, Redo } from '@mui/icons-material';
import SelectInput from '../select-input';
import { PeriodizationType } from '@/controller/group/enum/periodization-type.enum';
import { Training } from '@/controller/training/type/training.type';

interface ComponentPeriodizationProps {
  selectedComponent: TrainingComponent;
  training: Training;
}

export default function ComponentPeriodization(
  props: ComponentPeriodizationProps
) {
  const { selectedComponent, training } = props;

  const theme = useTheme();

  const { cycle, setDateFrom, setDateTo } = useGroup();

  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >(selectedComponent.supersets.map((s) => s.exercises.map((e) => e)).flat());
  const [allExercises, setAllExercises] = useState<TrainingExercise[]>(
    selectedComponent.supersets.map((s) => s.exercises.map((e) => e)).flat()
  );
  const [expandExerciseView, setExpandExerciseView] = useState(false);

  // filter trainings by cycle
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(cycle.from));
    setDateTo(dayjs(cycle.to));
  }, [cycle]);

  return (
    <Box>
      {selectedComponent.component && (
        <Box
          display="flex"
          width="100%"
          alignItems="center"
          flexDirection="column"
        >
          <Typography variant="h6">
            Periodize{' '}
            {selectedComponent.component?.name[0].toUpperCase() +
              selectedComponent.component?.name.slice(1)}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Typography
              variant="body2"
              color="text.secondary"
              display="flex"
              alignItems="center"
            >
              Periodization base is the outlined component, periodization type:
            </Typography>

            <SelectInput<PeriodizationType>
              label=""
              icon={<Redo />}
              value={cycle?.periodization?.type || ''}
              items={Object.values(PeriodizationType).filter(
                (p) => p !== PeriodizationType.NONE
              )}
              itemKey={undefined}
              itemName={undefined}
              setValue={(value) => {}}
              disabled
            />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            display="flex"
            alignItems="center"
          >
            Periodizing colored components, click components to select
            or deselect them.
          </Typography>
          <Typography
            variant="body1"
            mt={1}
            onClick={() => setExpandExerciseView((prev) => !prev)}
            sx={{
              cursor: 'pointer',
            }}
          >
            Exercises to periodize ({selectedExercises.length}/
            {allExercises.length})
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setExpandExerciseView(!expandExerciseView);
              }}
            >
              {!expandExerciseView ? <ArrowDropDown /> : <ArrowDropUp />}
            </IconButton>
          </Typography>
          <Box
            display="flex"
            flexWrap="wrap"
            flexDirection="column"
            gap={1}
            mt={1}
          >
            {expandExerciseView &&
              allExercises.map((exercise) => (
                <Box
                  key={exercise.id}
                  onClick={() => {
                    setSelectedExercises((prev) =>
                      prev.includes(exercise)
                        ? prev.filter((e) => e.id !== exercise.id)
                        : [...prev, exercise]
                    );
                  }}
                  sx={{
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 1,
                    backgroundColor: selectedExercises.includes(exercise)
                      ? theme.palette.primary.main
                      : theme.palette.background.dark,
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  {exercise.exercise
                    ? exercise.exercise.name[0].toUpperCase() +
                      exercise.exercise.name.slice(1)
                    : ''}
                </Box>
              ))}
          </Box>
        </Box>
      )}

      <Box mb={2} />
      {cycle && (
        <Box borderRadius={2} borderColor={theme.palette.primary.main}>
          {/* Training weeks */}
          <Stack spacing={1} mt={2}>
            {cycle.weeks.map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  index={i}
                  trainingComponent={selectedComponent}
                  week={week.map(({ date }) => dayjs(date!))}
                  addTrainingComponent={(trainingId, input) => {}}
                  deleteTrainingComponent={(trainingId, componentId) => {
                    return Promise.resolve();
                  }}
                  training={training}
                  periodizationView
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
