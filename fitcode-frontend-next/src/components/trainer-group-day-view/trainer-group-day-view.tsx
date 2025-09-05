import { CopyAll, Save } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import CustomDivider from '../custom-divider/custom-divider';
import LoadingOverlay from '../loading-overlay/loading-overlay';
import { DIVIDER_HEIGHT, MAX_WIDTH } from '../trainer-day-view/constant';
import GroupTrainerDayViewHeader from '../trainer-group-day-view-header/trainer-group-day-view-header';
import GroupTrainerDayViewTrainings from '../trainer-group-day-view-trainings/group-trainer-day-view-trainings';
import VerticalLinesBorders from '../vertical-lines-borders/vertical-lines-borders';
import { handleUpdateMultipleTrainings } from './state';
import { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import TrainingMembers from '@/components/training-members/training-members';
import { COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE } from '@/controller/training/constant/completed-future-workloads-default-value.constant';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

dayjs.extend(weekOfYear);

const commonService = CommonService.instance;

export default function TrainerDayView() {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const { components, exercises, methods } = useMain();
  const {
    group,
    cycle,
    setCycle,
    trainings,
    setTrainings,
    setDateFrom,
    setDateTo,
    setDetectedChanges,
  } = useGroup();

  const {
    day,
    training,
    setTraining,
    component,
    setComponent,
    selectedPeriod,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthleteWorkloads,
    isSettingAthleteWorkloads,
  } = useTrainerDayViewContext();

  const [isUpdatingTraining, setIsUpdatingTraining] = useState(false);
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

  const [isSticky, setIsSticky] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (!selectedPeriod) return;

    let from: Date, to: Date;
    if (selectedPeriod === 'AM') {
      from = day.date.startOf('day').toDate();
      to = day.date.startOf('day').add(12, 'hours').toDate();
    } else {
      from = day.date.startOf('day').add(11, 'hours').toDate();
      to = day.date.endOf('day').toDate();
    }

    handleApiRequest(
      router,
      () =>
        TrainingController.findAll({
          groupId: group.id,
          cycleId: cycle?.id,
          from,
          to,
        }),
      (trainings) => {
        setComponent(undefined);

        const foundTraining = trainings?.[0];
        if (!foundTraining) {
          setTraining(undefined);
          setLoading(false);
          return;
        }

        TrainingService.mapData(foundTraining, {
          components,
          exercises,
          methods,
        });

        setTraining(foundTraining);
        setLoading(false);
      },
      undefined,
      undefined
    );
  }, [selectedPeriod]);

  useEffect(() => {
    // fetch only for selectedAthlete, group avg is already on training itself
    setSelectedAthleteWorkloads(COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE);
  }, [selectedAthlete]);

  return (
    <Box width="100%" position="relative">
      {!screenSize.isSmallerThanLaptop && (
        <Box
          justifyContent="flex-end"
          alignItems="center"
          sx={{
            position: 'absolute',
            right: screenSize.isSmallerThanLaptop ? 2 : 10,
            top: screenSize.isSmallerThanLaptop ? -38 : -43,
            zIndex: 1300,
          }}
        >
          <Tooltip title="Save training" placement="bottom" sx={{ mx: 1 }}>
            <IconButton
              sx={{ mx: 0, cursor: 'pointer' }}
              onClick={() =>
                handleUpdateMultipleTrainings({
                  setTrainings,
                  training,
                  setTraining,
                  group,
                  cycle,
                  router,
                  components,
                  exercises,
                  methods,
                  setDetectedChanges,
                  selectedAthlete,
                  setSelectedAthleteWorkloads,
                  isSettingAthleteWorkloads,
                  setIsUpdatingTraining,
                })
              }
            >
              <Save fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton
            sx={{
              mx: 0,
              m: screenSize.isSmallerThanLaptop ? 0 : undefined,
              p: screenSize.isSmallerThanLaptop ? 0 : undefined,
              mr: screenSize.isSmallerThanLaptop ? 1 : 0,
              cursor: 'pointer',
            }}
          >
            <CopyAll fontSize="small" />
          </IconButton>
        </Box>
      )}
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

        {screenSize.isSmallerThanLaptop && (
          <Box
            justifyContent="flex-end"
            alignItems="center"
            sx={{
              position: 'absolute',
              right: screenSize.isSmallerThanLaptop ? 6 : 10,
              top: screenSize.isSmallerThanLaptop ? -38 : -43,
              zIndex: 1300,
            }}
          >
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
            >
              <IconButton
                sx={{
                  p: 0,
                  m: 0,
                }}
                onClick={() => {
                  handleUpdateMultipleTrainings({
                    setTrainings,
                    training,
                    setTraining,
                    group,
                    cycle,
                    router,
                    components,
                    exercises,
                    methods,
                    setDetectedChanges,
                    selectedAthlete,
                    setSelectedAthleteWorkloads,
                    isSettingAthleteWorkloads,
                    setIsUpdatingTraining,
                  });
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
            </Box>

            <IconButton
              sx={{
                mx: 0,
                m: screenSize.isSmallerThanLaptop ? 0 : undefined,
                p: screenSize.isSmallerThanLaptop ? 0 : undefined,
                cursor: 'pointer',
              }}
            >
              <CopyAll fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          height={!screenSize.isSmallerThanLaptop ? DIVIDER_HEIGHT : undefined}
          sx={{
            borderBottomRightRadius: !training || !cycle ? 0 : 10,
            borderBottomLeftRadius: !training || !cycle ? 0 : 10,
            bgcolor: 'background.default',
          }}
          justifyContent="space-evenly"
        >
          {/* Header with day and week selection */}
          <GroupTrainerDayViewHeader
            days={days}
            setDays={setDays}
            week={week}
          />
          <Box
            width="100%"
            display="flex"
            flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
            maxWidth={MAX_WIDTH}
            justifyContent="center"
            alignItems="center"
            sx={{
              p: isSticky ? 0 : undefined,
              py: selectedAthlete ? 0 : screenSize.isSmallerThanLaptop ? 2 : 5,
              pt:
                selectedAthlete && !screenSize.isSmallerThanLaptop
                  ? 1
                  : undefined,
              backgroundColor: theme.palette.background.default,
            }}
          >
            {/* Training members */}
            <TrainingMembers isSticky={isSticky} />
          </Box>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          maxWidth={MAX_WIDTH}
          sx={{
            mx: 'auto',
          }}
        >
          <CustomDivider />
        </Box>
        {/* Trainings for the day */}
        <Box maxWidth={MAX_WIDTH} mx="auto">
          <GroupTrainerDayViewTrainings loading={loading} />
        </Box>
      </Box>
      {isUpdatingTraining && (
        <LoadingOverlay title="Updating training plan..." />
      )}
    </Box>
  );
}
