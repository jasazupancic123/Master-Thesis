import { Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React from 'react';
import toast from 'react-hot-toast';

import { DIVIDER_HEIGHT, MAX_WIDTH } from './constant/dimensions.constant';
import { useTrainerDayViewHeaderSticky } from './hooks/use-sticky';
import SelectedMemberReport from '@/components/selected-member/selected-member-report';
import SelectedMemberWelness from '@/components/selected-member/selected-member-welness';
import TrainingMembers from '@/components/training-members/training-members';
import { lib } from '@/lib';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import HorizontalItemsList from '@/ui/horizontal-items-list';

dayjs.extend(weekOfYear);

interface Props {
  days: { label: string; value: string; sublabel: string }[];
  setDays: (days: { label: string; value: string; sublabel: string }[]) => void;
  week: number;
}

export default function GroupTrainerDayViewHeader({ days, setDays }: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    trainings,
    setDateFrom,
    setDateTo,
    detectedChanges,
    setDetectedChanges,
  } = useGroup();

  const {
    day,
    setDay,
    selectedPeriod,
    setSelectedPeriod,
    selectedAthlete,
    setSelectedExerciseIds,
  } = useTrainerDayView();

  const { isSticky } = useTrainerDayViewHeaderSticky();

  interface PeriodSelectProps {
    smallDisplay?: boolean;
  }

  function PeriodSelect(props: PeriodSelectProps) {
    const { smallDisplay } = props;
    return (
      <Box
        display="flex"
        flexDirection={smallDisplay ? 'row' : 'column'}
        ml={smallDisplay ? 0 : 2}
        py={smallDisplay ? 1 : 0}
        justifyContent={smallDisplay ? 'center' : undefined}
        gap={smallDisplay ? 4 : 0.5}
      >
        {['AM', 'PM'].map((period) => {
          const isPeriodSelected = selectedPeriod?.value === period;
          return (
            <Box
              key={period}
              display="flex"
              flexDirection={smallDisplay ? 'column-reverse' : 'row'}
              alignItems="center"
              gap={smallDisplay ? 0 : 1}
            >
              <Typography
                fontSize={12}
                fontWeight={600}
                sx={{
                  color: isPeriodSelected
                    ? theme.palette.text.secondary
                    : undefined,
                  cursor: 'pointer',
                  backgroundColor: isPeriodSelected
                    ? theme.palette.primary.main
                    : 'transparent',
                  borderRadius: 18,
                  px: 1,
                }}
                onClick={() => {
                  if (detectedChanges) {
                    toast.error('Unsaved changes will be lost', {
                      icon: '⚠️',
                      duration: 2000,
                    });

                    setDetectedChanges(false);
                    return;
                  }
                  const newPeriod = {
                    key: new Date(),
                    value: period as 'AM' | 'PM',
                  };
                  setSelectedPeriod(newPeriod);
                }}
              >
                {period}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }

  const HorizontalItems = () => {
    if (selectedAthlete) return null;

    return (
      <HorizontalItemsList
        items={days}
        value={day.date.toString()}
        setValue={(value) => {
          setDay({ label: '', date: dayjs(value) });
          setDateFrom(dayjs(value).startOf('day'));
          setDateTo(dayjs(value).endOf('day'));
          setSelectedExerciseIds([]);
        }}
        checkIsSameValue={(value: string) => {
          return dayjs(value).isSame(dayjs(day.date), 'day');
        }}
        dayView
        trainings={trainings}
        day={day}
        alertOnChange
        onArrowClick={(direction) => {
          const newDay =
            direction === 'left'
              ? day.date.subtract(1, 'week')
              : day.date.add(1, 'week');

          setDay({ label: '', date: newDay });
          setDateFrom(newDay.startOf('day'));
          setDateTo(newDay.endOf('day'));
          setDays(
            lib.common.date.getWeekDays(newDay).map(({ label, date }) => ({
              label,
              value: date.toString(),
              sublabel: lib.common.date.format(date, {
                withYear: false,
                withMonth: false,
                withoutDots: true,
              }),
            }))
          );
        }}
      />
    );
  };

  return (
    <Box
      id="trainer-day-view-header"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      {screenSize.isSmallTablet || screenSize.isMobile ? (
        selectedAthlete ? (
          <Box
            display="flex"
            width="100%"
            height={DIVIDER_HEIGHT}
            justifyContent="space-around"
            alignItems="flex-start"
          >
            <Box width="25%"></Box>
            <Box
              width="50%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              sx={{
                my: selectedAthlete ? 'auto' : undefined,
              }}
            >
              <SelectedMemberReport />
            </Box>
            <Box width="25%">
              <SelectedMemberWelness />
            </Box>
          </Box>
        ) : (
          <>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{
                my: selectedAthlete ? 'auto' : undefined,
              }}
            >
              <HorizontalItems />
              <PeriodSelect smallDisplay />
              <TrainingMembers isSticky={isSticky} />
            </Box>
          </>
        )
      ) : (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          minHeight={DIVIDER_HEIGHT}
        >
          <Box
            display="flex"
            width="100%"
            height={
              selectedAthlete ? DIVIDER_HEIGHT : `calc(${DIVIDER_HEIGHT} / 2)`
            }
            justifyContent="space-around"
            alignItems="flex-start"
          >
            <Box width="25%">
              <PeriodSelect />
            </Box>
            <Box
              width="50%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              sx={{
                my: selectedAthlete ? 'auto' : undefined,
              }}
            >
              {selectedAthlete ? (
                <SelectedMemberReport />
              ) : (
                <>
                  <HorizontalItems />
                </>
              )}
            </Box>
            <Box width="25%">
              <SelectedMemberWelness />
            </Box>
          </Box>
          {!selectedAthlete && (
            <Box
              display="flex"
              width="100%"
              minHeight={`calc(${DIVIDER_HEIGHT} / 2)`}
              justifyContent="center"
              alignItems="cetner"
              sx={{
                pb: 1,
              }}
            >
              <TrainingMembers isSticky={isSticky} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
