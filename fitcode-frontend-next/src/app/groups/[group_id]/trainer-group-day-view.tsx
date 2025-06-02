import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import { handleApiRequest } from '@/common/type/state.type';
import Circles from '@/components/circles';
import FloatingButton from '@/components/floating-button';
import TrainingCard from '@/components/trainer-day-view/training-card';
import TrainingMembers from '@/components/trainer-day-view/training-members';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Training } from '@/controller/training/type/training.type';
import {
  Save,
  SignalCellularConnectedNoInternet0BarSharp,
} from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE } from '@/controller/training/constant/completed-future-workloads-default-value.constant';
import { blue } from '@mui/material/colors';

dayjs.extend(weekOfYear);

const commonService = CommonService.instance;

export default function TrainerDayView() {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const {
    token,
    group,
    cycle,
    components,
    exercises,
    trainings,
    setTrainings,
    setFilteredTrainings,
    filteredTrainings,
    setDateFrom,
    setDateTo,
    setDetectedChanges,
    setCycle,
    detectedChanges,
  } = useGroup();

  const {
    training,
    setTraining,
    component,
    setSelectedSubgroup,
    selectedAthlete,
    selectedSubgroup,
    selectedAthleteWorkloads,
    setSelectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    isSettingAthleteWorkloads,
  } = useTrainerDayViewContext();

  const router = useRouter();
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
                })
    }))
  );

  const [isSticky, setIsSticky] = useState(false);
  const [loading, setLoading] = useState(true);

  async function handleUpdateMultipleTrainings() {
    if (!filteredTrainings || !filteredTrainings.length) return;

    await handleApiRequest(
      router,
      () =>
        TrainingController.batchUpdate(
          token,
          { groupId: group.id, cycleId: cycle!.id },
          filteredTrainings,
          customAthleteWorkloads
        ),
      (newTrainings) => {
        const mappedTrainings = newTrainings.map((newTraining) => {
          let mapped = TrainingService.mapComponents(newTraining, components);
          mapped = TrainingService.mapExercises(newTraining, exercises);
          return mapped;
        });

        const current = mappedTrainings.find((t) => t.id === training?.id);
        if (current) setTraining(current);

        setTrainings((prev) =>
          prev.map((t) => {
            const newTraining = mappedTrainings.find((nt) => nt.id === t.id);
            return newTraining ? newTraining : t;
          })
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => {
            const newTraining = mappedTrainings.find((nt) => nt.id === t.id);
            return newTraining ? newTraining : t;
          })
        );

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

  const [todaysTrainings, setTodaysTrainings] = useState<Training[]>(
    filteredTrainings.filter((t) =>
      commonService.date.isSameDay(day.date, dayjs(t.from))
    )
  );

  const [amTraining, setAmTraining] = useState<Training | undefined>(
    todaysTrainings.find((t) => dayjs(t.from).hour() < 12)
  );
  const [pmTraining, setPmTraining] = useState<Training | undefined>(
    todaysTrainings.find((t) => dayjs(t.from).hour() >= 12)
  );

  useEffect(() => {
    const newTodaysTrainings = filteredTrainings.filter((t) =>
      commonService.date.isSameDay(day.date, dayjs(t.from))
    );
    setTodaysTrainings(newTodaysTrainings);
    setAmTraining(newTodaysTrainings.find((t) => dayjs(t.from).hour() < 12));
    setPmTraining(newTodaysTrainings.find((t) => dayjs(t.from).hour() >= 12));
  }, [filteredTrainings]);

  useEffect(() => {
    setLoading(false);
  }, [todaysTrainings]);

  useEffect(() => {}, [selectedSubgroup]);

  useEffect(() => {
    const fetchWorkloads = async () => {
      if (!selectedAthlete) return;

      const combinedComponents = [] as TrainingComponent[];
      if (amTraining) combinedComponents.push(...amTraining.components);
      if (pmTraining) combinedComponents.push(...pmTraining.components);

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
          TrainingController.getUserWorkloadsByGroupIdAndExerciseIds(
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
      {!screenSize.isSmallerThanLaptop ? (
        <Box position="absolute" top="50%" right={0}>
          <FloatingButton
            label="Save trainings"
            //onClick={handleUpdateTraining}
            onClick={handleUpdateMultipleTrainings}
          />
        </Box>
      ) : (
        <IconButton
          onClick={() => {
            handleUpdateMultipleTrainings();
          }}
          sx={{ p: 0, ml: 2, position: 'fixed', bottom: 30, right: 30 }}
        >
          <Save
            sx={{
              mr: 0,
              cursor: 'pointer',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '50%',
              p: 1,
              fontSize: 40,
            }}
          />
        </IconButton>
      )}

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        minHeight={195}
        sx={{
          borderBottomRightRadius:
            todaysTrainings.length === 0 || !cycle ? 0 : 10,
          borderBottomLeftRadius:
            todaysTrainings.length === 0 || !cycle ? 0 : 10,
          bgcolor: 'background.paper',
        }}
        justifyContent="space-evenly"
      >
        <Stack
          direction="row"
          width="100%"
          p={2}
          pb={0}
          justifyContent={
            screenSize.isSmallerThanLaptop ? 'center' : 'space-between'
          }
        >
          <Box
            display={screenSize.isSmallerThanLaptop ? 'none' : 'flex'}
            justifyContent="center"
            flex={1}
          >
            <Box
              width="45%"
              bgcolor={theme.palette.background.light}
              p={!screenSize.isDesktop ? 0 : 1}
              px={!screenSize.isDesktop ? 1 : 3}
              sx={{
                borderTopLeftRadius: 10,
                borderBottomLeftRadius: 10,
              }}
              display="flex"
              alignItems="center"
            >
              <Typography
                width="100%"
                variant="body1"
                textAlign="center"
                sx={{
                  px: 0,
                  pr: !screenSize.isDesktop ? 1 : 4,
                  fontSize: !screenSize.isDesktop ? 15 : 20,
                }}
              >
                {selectedAthlete?.displayName ||
                  selectedSubgroup?.subgroup?.name ||
                  group.name}
              </Typography>
            </Box>
            <Box
            
              bgcolor={theme.palette.background.light}
              p={1}
              px={3}
              ml={0.5}
              sx={{
                borderTopRightRadius: 10,
                borderBottomRightRadius: 10,
              }}
              display="flex"
              alignItems="center"
            >
              <Typography
                variant="body1"
                textAlign="center"
                sx={{
                  px: 0,
                  pr: !screenSize.isDesktop ? 1 : 4,
                  fontSize: !screenSize.isDesktop ? 15 : 20,
                }}
              >
                {dayjs(day.date).format('DD-MMM-YY')}
              </Typography>
              <CalendarMonthIcon />
            </Box>
          </Box>

          <Box
            display="flex"
            flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
            gap={screenSize.isSmallerThanLaptop ? 2 : 0}
            justifyContent="center"
            alignItems={screenSize.isSmallerThanLaptop ? 'center' : undefined}
          >
            <Box
              display={screenSize.isSmallerThanLaptop ? 'flex' : 'none'}
              justifyContent="center"
              flex={1}
            >
              <Box
                bgcolor={theme.palette.background.light}
                p={!screenSize.isDesktop ? 0 : 1}
                px={!screenSize.isDesktop ? 1 : 3}
                sx={{
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                }}
                display="flex"
                alignItems="center"
              >
                <Typography
                  variant="body1"
                  textAlign="center"
                  sx={{
                    px: 0,
                    pr: !screenSize.isDesktop ? 1 : 4,
                    fontSize: !screenSize.isDesktop ? 15 : 20,
                  }}
                >
                  {selectedAthlete?.displayName ||
                    selectedSubgroup?.subgroup?.name ||
                    group.name}
                </Typography>
              </Box>
              <Box
                bgcolor={theme.palette.background.light}
                p={1}
                px={3}
                ml={0.5}
                sx={{
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 10,
                }}
                display="flex"
                alignItems="center"
              >
                <Select
                  value={cycle?.name || ''}
                  onChange={(e) =>
                    setCycle(
                      group.cycles.find((c) => c.name === e.target.value)
                    )
                  }
                  renderValue={(value) => value || 'Select cycle'}
                  displayEmpty
                  sx={{
                    color: 'white',
                    fontSize: screenSize.isDesktop ? 20 : undefined,
                    bgcolor: 'transparent',
                    border: 'none',
                    pl: 1,
                    '&:before, &:after': { borderBottom: 'none !important' },
                  }}
                  variant="standard"
                >
                  <MenuItem value="" disabled>
                    Select cycle
                  </MenuItem>

                  {group.cycles.map((cycle) => (
                    <MenuItem key={cycle.name} value={cycle.name}>
                      {cycle.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
            <Circles
              items={days}
              value={day.date.toString()}
              setValue={(value) => {
                setDay({ label: '', date: dayjs(value) });
                setDateFrom(dayjs(value).startOf('day'));
                setDateTo(dayjs(value).endOf('day'));
              }}
              getBackgroundColor={(value, itemValue) =>
                commonService.date.isSameDay(dayjs(value), dayjs(itemValue))
                  ? theme.palette.primary.main
                  : 'rgba(255, 255, 255, 0.1)'
              }

              sx={{
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
              }}
              arrows
              onArrowClick={(direction) => {
                const newDay =
                  direction === 'left'
                    ? day.date.subtract(1, 'week')
                    : day.date.add(1, 'week');

                setDay({ label: '', date: newDay });
                setDateFrom(newDay.startOf('day'));
                setDateTo(newDay.endOf('day'));
                setDays(
                  commonService.date
                    .getWeekDays(newDay)
                    .map(({ label, date }) => ({
                      label: label[0],
                      value: date.toString(),
                      // sublabel: screenSize.isSmallerThanLaptop
                      //   ? commonService.date.format(date, {
                      //       withYear: false,
                      //     })
                      //   : undefined,
                      sublabel: commonService.date.format(date, {
                             withYear: false,
                           })
                      
                    }))
                );
              }}
            />
          </Box>

          <Box
            display={screenSize.isSmallerThanLaptop ? 'none' : 'flex'}
            justifyContent="center"
            flex={1}
          >
            <Box
              bgcolor={theme.palette.background.light}
              p={!screenSize.isDesktop ? 0 : 1}
              px={!screenSize.isDesktop ? 1 : 3}
              sx={{
                borderTopLeftRadius: 10,
                borderBottomLeftRadius: 10,
              }}
              display="flex"
              alignItems="center"
            >
              <Typography
                variant="body1"
                textAlign="center"
                sx={{
                  px: 3,
                  fontSize: !screenSize.isDesktop ? 15 : 20,
                }}
              >
                Week {week}
              </Typography>
            </Box>
            <Box
              bgcolor={theme.palette.background.light}
              p={1}
              px={3}
              ml={0.5}
              sx={{
                borderTopRightRadius: 10,
                borderBottomRightRadius: 10,
              }}
              display="flex"
              alignItems="center"
            >
              <Select
                value={cycle?.name || ''}
                onChange={(e) =>
                  setCycle(group.cycles.find((c) => c.name === e.target.value))
                }
                renderValue={(value) => value || 'Select cycle'}
                displayEmpty
                sx={{
                  color: 'white',
                  fontSize: screenSize.isDesktop ? 20 : undefined,
                  bgcolor: 'transparent',
                  border: 'none',
                  pl: 1,
                  '&:before, &:after': { borderBottom: 'none !important' },
                }}
                variant="standard"
              >
                <MenuItem value="" disabled>
                  Select cycle
                </MenuItem>

                {group.cycles.map((cycle) => (
                  <MenuItem key={cycle.name} value={cycle.name}>
                    {cycle.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Stack>

        <Box
          display="flex"
          flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
          width="100%"
          justifyContent="center"
          alignItems="center"
          sx={{ p: isSticky ? 0 : undefined, pt: 0, pb: component ? 0 : 2 }}
        >
          <TrainingMembers isSticky={isSticky} />
        </Box>
        {/* <Subgroups showSubgroups={showSubgroups} /> */}
      </Box>

      {!cycle ? (
        <Box
          display="flex"
          bgcolor={'background.paper'}
          width="100%"
          p={2}
          justifyContent="center"
          sx={{
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
          }}
        >
          <Typography variant="h6" mb={2}>
            Select a cycle
          </Typography>
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          pb={15}
          sx={{
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
          }}
        >
          {/* Training set groups with set exercises */}
          {!loading && todaysTrainings.length === 0 ? (
            <Box
              display="flex"
              bgcolor={'background.paper'}
              width="100%"
              p={2}
              justifyContent="center"
              sx={{
                borderBottomRightRadius: 10,
                borderBottomLeftRadius: 10,
              }}
            >
              <Typography variant="h6" mb={2}>
                No session for current date
              </Typography>
            </Box>
          ) : (
            <>
              {amTraining && (
                <TrainingCard day={day} training={amTraining} period="AM" />
              )}

              {pmTraining && (
                <TrainingCard day={day} training={pmTraining} period="PM" />
              )}
            </>
          )}
        </Box>
      )}
    </>
  );
}
