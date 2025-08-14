import { Box, Button, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import SelectInput from '../select-input/select-input';
import TrainingWeek from '../training-week/training-week';
import { CommonService } from '@/common/service/common.service';
import type { Target } from '@/controller/target/type/target.type';
import { PeriodizationType } from '@/controller/training/enum/periodization-type.enum';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface ComponentPeriodizationProps {
  selectedComponent: TrainingComponent;
  training: Training;
}

const commonService = CommonService.instance;

export default function ComponentPeriodization(
  props: ComponentPeriodizationProps
) {
  const { selectedComponent, training } = props;

  const theme = useTheme();
  const screenSize = useScreenSize();

  const { cycle, trainings, setDateFrom, setDateTo } = useGroup();

  const { selectedExercises } = useTrainerDayViewContext();

  const [allExercises, _setAllExercises] = useState<TrainingExercise[]>(
    selectedComponent.supersets.map((s) => s.exercises.map((e) => e)).flat()
  );
  const [expandExerciseView, _setExpandExerciseView] = useState(false);

  const [_allPossibleTrainings, setAllPossibleTrainings] = useState<Training[]>(
    []
  );
  const [selectedTrainings, setSelectedTrainings] = useState<Training[]>([]);

  const [selectedTarget, _setSelectedTarget] = useState(
    selectedComponent.target
  );

  useEffect(() => {
    if (!selectedTarget) {
      // set to all

      const tmpSelectedTrainings = trainings.filter((t) =>
        t.components.some(
          (c) =>
            c.component?.id === selectedComponent.component?.id &&
            cycle &&
            CommonService.instance.date.isBetween(
              t.from,
              cycle.from,
              cycle.to
            ) &&
            CommonService.instance.date.isBetween(t.to, training.to, cycle?.to)
        )
      );

      setSelectedTrainings(tmpSelectedTrainings);
      setAllPossibleTrainings(tmpSelectedTrainings);
      return;
    }

    const tmpSelectedTrainings = trainings.filter((t) =>
      t.components.some(
        (c) =>
          c.component?.id === selectedComponent.component?.id &&
          c.target?.id === selectedTarget.id &&
          cycle &&
          CommonService.instance.date.isBetween(t.from, cycle.from, cycle.to) &&
          CommonService.instance.date.isBetween(t.to, training.to, cycle?.to)
      )
    );

    setAllPossibleTrainings(tmpSelectedTrainings);
    setSelectedTrainings(tmpSelectedTrainings);
  }, [selectedTarget]);

  // filter trainings by cycle
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(cycle.from));
    setDateTo(dayjs(cycle.to));
  }, [cycle]);

  const handlePeriodize = () => {
    if (!selectedComponent.periodizationType) {
      toast.error('Please select a periodization type.');
      return;
    }

    if (
      selectedComponent.periodizationType === PeriodizationType.DUP_TABLE_BASED
    ) {
      toast.error('DUP table based periodization is not supported yet.');
      return;
    }
  };

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
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={1}
          >
            {selectedComponent.periodizationType ? (
              <>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="100%"
                  textAlign="center"
                  flexDirection={screenSize.isMobile ? 'column' : 'row'}
                  gap={!selectedTarget ? 1 : screenSize.isMobile ? 1.5 : 0}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    display="flex"
                    alignItems="center"
                  >
                    Training target to periodize:
                  </Typography>

                  {selectedTarget ? (
                    <SelectInput<Target>
                      label=""
                      icon={<></>}
                      value={selectedTarget?.id || ''}
                      items={[selectedTarget]}
                      itemKey={'id'}
                      itemName={'name'}
                      setValue={() => {}}
                      disabled
                      selectPadding={'0'}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                    >
                      No target selected
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  textAlign="center"
                >
                  Periodizing colored components, click components to select or
                  deselect them.
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
              </>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                display="flex"
                alignItems="center"
                textAlign="center"
              >
                No periodization type selected.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Box display="flex" justifyContent="center" width="100%">
        <Button
          variant="contained"
          sx={{ marginX: 'auto' }}
          onClick={handlePeriodize}
        >
          Periodize
        </Button>
      </Box>

      <Box mb={2} />
      {cycle && (
        <Box borderRadius={2} borderColor={theme.palette.primary.main}>
          {/* Training weeks */}
          <Stack spacing={1} mt={2}>
            {commonService.date.weeks(cycle.from, cycle.to).map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  trainingComponent={selectedComponent}
                  week={week.map(({ date }) => dayjs(date!))}
                  addTrainingComponent={() => {}}
                  deleteTrainingComponent={() => {
                    return Promise.resolve();
                  }}
                  training={training}
                  periodizationView
                  selectedTrainings={selectedTrainings}
                  setSelectedTrainings={setSelectedTrainings}
                  selectedTarget={selectedTarget}
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
