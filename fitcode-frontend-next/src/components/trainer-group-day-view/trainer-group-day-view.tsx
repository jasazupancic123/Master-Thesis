import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import CustomDivider from '../../util/custom-divider/custom-divider';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import GroupTrainerDayViewHeader from '../trainer-group-day-view-header/trainer-group-day-view-header';
import GroupTrainerDayViewTrainings from '../trainer-group-day-view-trainings/group-trainer-day-view-trainings';
import VerticalLinesBorders from '../../util/vertical-lines-borders/vertical-lines-borders';
import { setTrainingOnDayView } from './state';
import { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

dayjs.extend(weekOfYear);

const commonService = CommonService.instance;

export default function TrainerDayView() {
  const screenSize = useScreenSize();
  const router = useRouter();

  const controller = TrainingController.getInstance();
  const { components, exercises, methods } = useMain();
  const { group, trainings, cycle, setCycle, setDateFrom, setDateTo } =
    useGroup();

  const {
    day,
    training,
    setTraining,
    component,
    setComponent,
    selectedPeriod,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthleteCompletedWorkloads: setSelectedAthleteWorkloads,
    isSettingAthleteWorkloads,
    setLoading,
  } = useTrainerDayViewContext();

  const [week, setWeek] = useState<number>(1);
  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label,
      value: date.toString(),
      sublabel: commonService.date.format(date, {
        withYear: false,
        withMonth: false,
        withoutDots: true,
      }),
    }))
  );

  useEffect(() => {
    const cycleInDate = group.cycles.find((c) =>
      commonService.date.isBetween(day.date, c.from, c.to)
    );
    if (cycleInDate) setCycle(cycleInDate);
  }, [day]);

  {
    /* Sets new training when new period or day is clicked */
  }
  useEffect(() => {
    if (!selectedPeriod) return;
    setTrainingOnDayView(selectedPeriod, {
      day,
      trainings,
      component,
      setTraining,
      setComponent,
      setLoading,
      components,
      exercises,
      methods,
      selectedSubgroup,
      setSelectedSubgroup,
    });
  }, [selectedPeriod]);

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
    if (!component) setSelectedSubgroup(null);
  }, [component]);

  useEffect(() => {
    // fetch only for selectedAthlete, group avg is already on training itself
    const fetchWorkloads = async () => {
      if (!selectedAthlete) return;

      const combinedComponents = training?.components;

      if (!combinedComponents || !combinedComponents.length) {
        setSelectedAthleteWorkloads([]);
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
        setSelectedAthleteWorkloads([]);
        return;
      }

      isSettingAthleteWorkloads.current = true;
      handleApiRequest(
        router,
        () =>
          controller.findCompletedAthleteWorkloads(
            training.id,
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
    else setSelectedAthleteWorkloads([]);
  }, [selectedAthlete]);

  return (
    <Box width="100%" position="relative">
      <Box
        position="relative"
        sx={{
          maxWidth: MAX_WIDTH,
          minHeight: 'calc(100vh - 50px)',
          mx: 'auto',
          overflowY: 'none',
        }}
      >
        <VerticalLinesBorders />

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          sx={{
            borderBottomRightRadius: !training || !cycle ? 0 : 10,
            borderBottomLeftRadius: !training || !cycle ? 0 : 10,
            bgcolor: 'background.default',
          }}
          justifyContent="flex-start"
        >
          {/* Header with day and week selection */}
          <GroupTrainerDayViewHeader
            days={days}
            setDays={setDays}
            week={week}
          />
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          maxWidth={MAX_WIDTH}
          sx={{
            mx: 'auto',
            px: 3,
            mt: screenSize.isMobile || screenSize.isTablet ? 2 : 0,
          }}
        >
          <CustomDivider />
        </Box>

        {/* Trainings for the day */}
        <Box maxWidth={MAX_WIDTH} mx="auto">
          <GroupTrainerDayViewTrainings />
        </Box>
      </Box>
    </Box>
  );
}
