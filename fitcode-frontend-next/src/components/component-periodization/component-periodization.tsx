import { useGroup } from '@/store/group-provider';
import {
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import TrainingWeek from '../training-week/training-week';
import dayjs from 'dayjs';
import { ArrowDropDown, ArrowDropUp, Info, Redo } from '@mui/icons-material';
import SelectInput from '../select-input/select-input';
import { PeriodizationType } from '@/controller/group/enum/periodization-type.enum';
import { Training } from '@/controller/training/type/training.type';
import { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import { useRouter } from 'next/navigation';
import { TrainingController } from '@/controller/training/training.controller';
import toast from 'react-hot-toast';
import { TrainingService } from '@/controller/training/training.service';
import { useScreenSize } from '@/store/screen-size-provider';
import { Target } from '@/controller/target/type/target.type';

interface ComponentPeriodizationProps {
  selectedComponent: TrainingComponent;
  training: Training;
}

export default function ComponentPeriodization(
  props: ComponentPeriodizationProps
) {
  const { selectedComponent, training } = props;

  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const {
    token,
    cycle,
    trainings,
    setDateFrom,
    setDateTo,
    setTrainings,
    setFilteredTrainings,
    components,
    exercises,
    methods,
  } = useGroup();

  const [selectedPeriodizationType, setSelectedPeriodizationType] =
    useState<PeriodizationType>(PeriodizationType.NONE);
  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >(selectedComponent.supersets.map((s) => s.exercises.map((e) => e)).flat());
  const [allExercises, setAllExercises] = useState<TrainingExercise[]>(
    selectedComponent.supersets.map((s) => s.exercises.map((e) => e)).flat()
  );
  const [expandExerciseView, setExpandExerciseView] = useState(false);

  const [allPossibleTrainings, setAllPossibleTrainings] = useState<Training[]>(
    []
  );
  const [selectedTrainings, setSelectedTrainings] = useState<Training[]>([]);

  const [selectedTarget, setSelectedTarget] = useState(
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
    if (
      !selectedPeriodizationType ||
      selectedPeriodizationType === PeriodizationType.NONE
    ) {
      toast.error('Please select a periodization type.');
      return;
    }

    if (selectedPeriodizationType === PeriodizationType.DUP_TABLE_BASED) {
      toast.error('DUP table based periodization is not supported yet.');
      return;
    }

    const excludedTrainingIds = allPossibleTrainings
      .filter((t) => !selectedTrainings.some((st) => st.id === t.id))
      .map((t) => t.id);
    const exerciseIds = selectedExercises.map((e) => e.id);

    handleApiRequest(
      router,
      () =>
        TrainingController.periodizeTrainings(token, {
          baseTrainingId: training.id,
          excludedTrainingIds,
          componentId: selectedComponent.id,
          exerciseIds,
          periodizationType: selectedPeriodizationType,
        }),
      (periodizedTrainings) => {
        periodizedTrainings = periodizedTrainings.map((t) =>
          TrainingService.mapComponentsExercisesMethods(
            t,
            components,
            exercises,
            methods
          )
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => {
            const newTraining = periodizedTrainings.find(
              (nt) => nt.id === t.id
            );
            return newTraining ? newTraining : t;
          })
        );

        setTrainings((prev) =>
          prev.map((t) => {
            const newTraining = periodizedTrainings.find(
              (nt) => nt.id === t.id
            );
            return newTraining ? newTraining : t;
          })
        );

        toast.success('Trainings periodized successfully.');
      },
      undefined,
      'Failed to periodize trainings'
    );
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
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              width="100%"
              textAlign="center"
              flexDirection={screenSize.isMobile ? 'column' : 'row'}
              gap={1}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                display="flex"
                alignItems="center"
              >
                Periodization base is the outlined component, periodization
                type:
              </Typography>

              <SelectInput<PeriodizationType>
                label=""
                icon={<Redo />}
                value={selectedPeriodizationType || ''}
                items={Object.values(PeriodizationType).filter(
                  (p) => p !== PeriodizationType.NONE
                )}
                itemKey={undefined}
                itemName={undefined}
                setValue={(value) => {
                  setSelectedPeriodizationType(value as PeriodizationType);
                }}
                selectPadding={'0'}
              />
            </Box>
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
                  setValue={(value) => {}}
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
          </Box>
          <Typography
            variant="body1"
            mt={1}
            onClick={() => setExpandExerciseView((prev) => !prev)}
            textAlign="center"
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
                  selectedTrainings={selectedTrainings}
                  setSelectedTrainings={setSelectedTrainings}
                  selectedTarget={selectedTarget}
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
      <Box display="flex" justifyContent="center" width="100%" mt={2}>
        <Button
          variant="contained"
          sx={{ marginX: 'auto' }}
          onClick={handlePeriodize}
        >
          Periodize
        </Button>
      </Box>
    </Box>
  );
}
