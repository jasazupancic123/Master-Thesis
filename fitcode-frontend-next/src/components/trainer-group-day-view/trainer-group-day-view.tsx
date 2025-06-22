import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import { handleApiRequest } from '@/common/type/state.type';
import FloatingButton from '@/components/floating-button/floating-button';
import TrainingMembers from '@/components/training-members/training-members';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Delete, Save } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material';
import { COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE } from '@/controller/training/constant/completed-future-workloads-default-value.constant';
import GroupTrainerDayViewHeader from '../trainer-group-day-view-header/trainer-group-day-view-header';
import GroupTrainerDayViewTrainings from '../trainer-group-day-view-trainings/group-trainer-day-view-trainings';

dayjs.extend(weekOfYear);

const commonService = CommonService.instance;

export default function TrainerDayView() {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const {
    token,
    group,
    cycle,
    components,
    exercises,
    setTrainings,
    setDateFrom,
    setDateTo,
    setDetectedChanges,
    setCycle,
    methods,
  } = useGroup();

  const {
    training,
    setTraining,
    todaysTrainings,
    setTodaysTrainings,
    component,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
    setSelectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    isSettingAthleteWorkloads,
  } = useTrainerDayViewContext();

  const [day, setDay] = useState<Day>(commonService.date.getToday());
  const [week, setWeek] = useState<number>(1);
  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label: label[0],
      value: date.toString(),
      // sublabel: screenSize.isSmallerThanLaptop
      //   ? commonService.date.format(date, { withYear: false })
      //   : undefined,
      sublabel: commonService.date.format(date, {
        withYear: false,
      }),
    }))
  );

  useEffect(() => {
    const cycleInDate = group.cycles.find((c) =>
      commonService.date.isBetween(day.date, c.from, c.to)
    );
    if (cycleInDate) setCycle(cycleInDate);
  }, [day]);

  const [isSticky, setIsSticky] = useState(false);
  const [loading, setLoading] = useState(true);

  async function handleUpdateMultipleTrainings() {
    const todaysTrainingsFiltered = todaysTrainings.filter(
      (t) => t !== undefined
    );

    await handleApiRequest(
      router,
      () =>
        TrainingController.batchUpdate(
          token,
          { groupId: group.id, cycleId: cycle!.id },
          todaysTrainingsFiltered,
          customAthleteWorkloads
        ),
      (newTrainings) => {
        const mappedTrainings = newTrainings.map((newTraining) => {
          const mapped = TrainingService.mapComponentsExercisesMethods(
            newTraining,
            components,
            exercises,
            methods
          );
          return mapped;
        });

        const minimalTrainings = mappedTrainings.map((t) =>
          TrainingService.convertFromTrainingToTrainingMinimal(t)
        );

        const current = mappedTrainings.find((t) => t.id === training?.id);
        if (current) setTraining(current);

        setTrainings((prev) =>
          prev.map((t) => {
            const newTraining = minimalTrainings.find((nt) => nt.id === t.id);
            return newTraining ? newTraining : t;
          })
        );

        setTodaysTrainings((prev) =>
          prev.map((t) => {
            const newTraining = mappedTrainings.find((nt) => nt.id === t.id);
            return newTraining ? newTraining : t;
          })
        );

        setSelectedAthlete(undefined);

        setCustomAthleteWorkloads([]);

        setDetectedChanges(false);
        toast.success('Trainings updated successfully');
      },
      undefined,
      'Error when updating training'
    );
  }

  useEffect(() => {
    setDateFrom(day.date.startOf('day'));
    setDateTo(day.date.endOf('day'));
    if (!cycle?.from) return;

    const cycleStart = dayjs(cycle.from).startOf('day');
    const cycleWeek = cycleStart.week();
    const currentWeek = day.date.subtract(1, 'day').week();
    const diff = currentWeek - cycleWeek + 1;

    setWeek(diff);
  }, [day, cycle]);

  useEffect(() => {
    if (screenSize.isMobile || screenSize.isLandscapeMobile) return;

    const handleScroll = () => {
      if (screenSize.isMobile || screenSize.isLandscapeMobile) return;
      if (screenSize.isSmallerThanLaptop) {
        setIsSticky(false);
        return;
      }

      const scrollY = window.scrollY;
      const screenHeight = window.innerHeight;
      setIsSticky(scrollY > screenHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [screenSize]);

  useEffect(() => {
    if (!component) setSelectedSubgroup(null);
  }, [component]);

  useEffect(() => {
    handleApiRequest(
      router,
      () => TrainingController.findByDay(token, day.date.toDate(), group.id),
      (response) => {
        const mapped = response.map((t) =>
          TrainingService.mapComponentsExercisesMethods(
            t,
            components,
            exercises,
            methods
          )
        );
        setTodaysTrainings(mapped);
      },
      undefined,
      undefined
    );
  }, [day]);

  useEffect(() => {
    setLoading(false);
  }, [todaysTrainings]);

  useEffect(() => {
    const fetchWorkloads = async () => {
      if (!selectedAthlete) return;

      const combinedComponents = todaysTrainings
        .map((t) => t.components)
        .flat();

      if (!combinedComponents || !combinedComponents.length) {
        setSelectedAthleteWorkloads(COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE);
        return;
      }

      const uniqueExerciseIds = [] as string[];
      combinedComponents.forEach((c) => {
        c.supersets.forEach((s) => {
          s.exercises.forEach((e) => {
            if (!uniqueExerciseIds.includes(e.id)) uniqueExerciseIds.push(e.id);
          });
        });
      });

      if (!uniqueExerciseIds.length) {
        setSelectedAthleteWorkloads(COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE);
        return;
      }

      isSettingAthleteWorkloads.current = true;
      handleApiRequest(
        router,
        () =>
          TrainingController.findAthleteGroupWorkloads(
            token,
            group.id,
            uniqueExerciseIds,
            selectedAthlete.uid
          ),
        (workloads) => {
          setSelectedAthleteWorkloads(workloads);
          isSettingAthleteWorkloads.current = false;
        },
        undefined,
        'Failed to fetch workloads'
      );
      isSettingAthleteWorkloads.current = false;
    };

    // fetch only for selectedAthlete, group avg is already on training itself
    if (selectedAthlete) fetchWorkloads();
    else setSelectedAthleteWorkloads(COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE);
  }, [selectedAthlete]);

  return (
    <>
      {/* Save button */}
      {!screenSize.isSmallerThanLaptop ? (
        <Box position="absolute" top="50%" right={0}>
          <FloatingButton
            label="Save trainings"
            onClick={handleUpdateMultipleTrainings}
          />
        </Box>
      ) : (
        <Box
          display="flex"
          sx={{
            p: 0,
            ml: 2,
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
          gap={1}
        >
          <IconButton
            onClick={() => {
              handleUpdateMultipleTrainings();
            }}
            sx={{
              p: 0,
            }}
          >
            <Save
              sx={{
                cursor: 'pointer',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '50%',
                p: 1,
                fontSize: 40,
              }}
            />
          </IconButton>
          <IconButton
            sx={{
              p: 0,
            }}
            onClick={() => {}}
          >
            <Delete
              sx={{
                cursor: 'pointer',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '50%',
                p: 1,
                fontSize: 40,
              }}
            />
          </IconButton>
        </Box>
      )}

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        minHeight={195}
        sx={{
          borderBottomRightRadius: !todaysTrainings.length || !cycle ? 0 : 10,
          borderBottomLeftRadius: !todaysTrainings.length || !cycle ? 0 : 10,
          bgcolor: 'background.paper',
        }}
        justifyContent="space-evenly"
      >
        {/* Header with day and week selection */}
        <GroupTrainerDayViewHeader
          day={day}
          setDay={setDay}
          days={days}
          setDays={setDays}
          week={week}
        />
        <Box
          display="flex"
          flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
          width="100%"
          justifyContent="center"
          alignItems="center"
          sx={{ p: isSticky ? 0 : undefined, pt: 0, pb: component ? 0 : 2 }}
        >
          {/* Training members */}
          <TrainingMembers isSticky={isSticky} />
        </Box>
      </Box>

      {/* Trainings for the day */}
      <GroupTrainerDayViewTrainings day={day} loading={loading} />
    </>
  );
}
