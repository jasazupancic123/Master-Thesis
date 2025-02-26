import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import { handleApiRequest } from '@/common/type/state.type';
import Circles from '@/components/circles';
import FloatingButton from '@/components/floating-button';
import Subgroups from '@/components/trainer-day-view/subgroups';
import TrainingCard from '@/components/trainer-day-view/training-card';
import TrainingMembers from '@/components/trainer-day-view/training-members';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Save } from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import {
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

dayjs.extend(weekOfYear);

const commonService = CommonService.instance;

export default function TrainerDayView() {
  const screenSize = useScreenSize();
  const {
    token,
    group,
    cycle,
    components,
    exercises,
    setTrainings,
    setFilteredTrainings,
    filteredTrainings,
    setDateFrom,
    setDateTo,
    setDetectedChanges,
    setCycle,
  } = useGroup();

  const { training, setTraining, component, setSelectedSubgroup } =
    useTrainerDayViewContext();

  const router = useRouter();
  const [day, setDay] = useState<Day>(commonService.date.getToday());
  const [week, setWeek] = useState<number>(1);
  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label: label[0],
      value: date.toString(),
      sublabel: screenSize.isSmallerThanLaptop
        ? commonService.date.format(date, { withYear: false })
        : undefined,
    }))
  );

  const [showSubgroups, setShowSubgroups] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [loading, setLoading] = useState(true);

  async function handleUpdateTraining() {
    if (!training) return;

    await handleApiRequest(
      router,
      () => TrainingController.update(token, training.id, training),
      (newTraining) => {
        let mapped = TrainingService.mapComponents(newTraining, components);
        mapped = TrainingService.mapExercises(newTraining, exercises);

        if (training && newTraining.id === training.id) setTraining(mapped);
        setTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        setDetectedChanges(false);
        toast.success('Training updated successfully');
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

  const todaysTrainings = filteredTrainings.filter((t) =>
    commonService.date.isSameDay(day.date, dayjs(t.from))
  );

  const amTraining = todaysTrainings.find((t) => dayjs(t.from).hour() < 12);
  const pmTraining = todaysTrainings.find((t) => dayjs(t.from).hour() >= 12);

  useEffect(() => {
    setLoading(false);
  }, [todaysTrainings]);

  if (!cycle)
    return (
      <Box
        bgcolor={'background.paper'}
        width="100%"
        p={2}
        justifyContent="center"
      >
        <Typography variant="h6" textAlign="center">
          Select a cycle
        </Typography>
      </Box>
    );

  return (
    <>
      {!screenSize.isSmallerThanLaptop && (
        <Box position="absolute" top="50%" right={-5}>
          <FloatingButton
            label="Save training"
            onClick={handleUpdateTraining}
          />
        </Box>
      )}

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        minHeight={195}
        sx={{
          borderBottomRightRadius: todaysTrainings.length === 0 ? 0 : 10,
          borderBottomLeftRadius: todaysTrainings.length === 0 ? 0 : 10,
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
              bgcolor="#283444"
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
                sx={{
                  px: 0,
                  pr: !screenSize.isDesktop ? 1 : 4,
                  fontSize: !screenSize.isDesktop ? 15 : 20,
                }}
              >
                {group.name}
              </Typography>
            </Box>
            <Box
              bgcolor="#283444"
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
            justifyContent="center"
            alignItems={screenSize.isSmallerThanLaptop ? 'center' : undefined}
          >
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
                  ? '#1EB980'
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
                      sublabel: screenSize.isSmallerThanLaptop
                        ? commonService.date.format(date, {
                            withYear: false,
                          })
                        : undefined,
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
              bgcolor="#283444"
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
                sx={{
                  pl: 1,
                  pr: 4,
                  fontSize: !screenSize.isDesktop ? 15 : 20,
                }}
              >
                Week {week}
              </Typography>
            </Box>
            <Box
              bgcolor="#283444"
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
                value={cycle.name}
                onChange={(e) =>
                  setCycle(group.cycles.find((c) => c.name === e.target.value))
                }
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

          {!isSticky && component && (
            <Tooltip title="Show subgroups">
              <IconButton
                onClick={() =>
                  training ? setShowSubgroups(!showSubgroups) : null
                }
                sx={{ p: 0, height: 30, width: 30, mb: 0 }}
              >
                <GroupIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Subgroups showSubgroups={showSubgroups} />
      </Box>

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
      {screenSize.isSmallerThanLaptop && (
        <IconButton
          onClick={() => {
            handleUpdateTraining();
          }}
          sx={{ p: 0, ml: 2, position: 'fixed', bottom: 30, right: 30 }}
        >
          <Save
            sx={{
              mr: 0,
              cursor: 'pointer',
              backgroundColor: '#1EB980',
              borderRadius: '50%',
              p: 1,
              fontSize: 40,
            }}
          />
        </IconButton>
      )}
    </>
  );
}
