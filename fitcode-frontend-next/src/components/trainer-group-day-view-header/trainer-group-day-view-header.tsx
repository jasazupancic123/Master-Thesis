import { Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React from 'react';
import toast from 'react-hot-toast';

import GroupCycleInfo from '../group-cycle-info/group-cycle-info';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import { COLOR } from '@/common/constant/color.constant';
import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

dayjs.extend(weekOfYear);

const commonService = CommonService.instance;

interface GroupTrainerDayViewHeaderProps {
  days: { label: string; value: string; sublabel: string }[];
  setDays: (days: { label: string; value: string; sublabel: string }[]) => void;
  week: number;
}

export default function GroupTrainerDayViewHeader(
  props: GroupTrainerDayViewHeaderProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { days, setDays, week } = props;

  const {
    group,
    cycle,
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
    wellness,
    setSelectedExercises,
  } = useTrainerDayViewContext();

  interface PeriodSelectProps {
    smallDisplay?: boolean;
  }

  function PeriodSelect(props: PeriodSelectProps) {
    const { smallDisplay } = props;
    return (
      <Box
        display="flex"
        flexDirection={smallDisplay ? 'row' : 'column'}
        mt={smallDisplay ? 3 : 1}
        ml={smallDisplay ? 0 : 2}
        justifyContent={smallDisplay ? 'center' : undefined}
        gap={smallDisplay ? 4 : 1}
      >
        {['AM', 'PM'].map((period) => {
          const isPeriodSelected = selectedPeriod === period;
          return (
            <Box
              key={period}
              display="flex"
              flexDirection={smallDisplay ? 'column-reverse' : 'row'}
              alignItems="center"
              gap={smallDisplay ? 0 : 1}
              onClick={() => {
                if (detectedChanges) {
                  toast.error('Unsaved changes will be lost', {
                    icon: '⚠️',
                    duration: 2000,
                  });

                  setDetectedChanges(false);
                  return;
                }
                setSelectedPeriod(period as 'AM' | 'PM');
              }}
            >
              <Box
                height={16}
                width={4}
                sx={{
                  backgroundColor: isPeriodSelected
                    ? theme.palette.primary.main
                    : 'transparent',
                  borderRadius: 5,
                  transform: smallDisplay ? 'rotate(90deg)' : 'none',
                }}
              />

              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  cursor: 'pointer',
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
    return selectedAthlete ? (
      <HorizontalItemsList
        items={[
          {
            label: 'BW (kg)',
            value:
              wellness
                .find((w) => w.userId === selectedAthlete.uid)
                ?.weight?.toString() || 'N/A',
            sublabel: COLOR[3],
          },
          {
            label: 'Att (%)',
            value: '99',
            sublabel: theme.palette.primary.main,
          },
        ]}
        value={day.date.toString()}
        setValue={() => {}}
        selectedAthlete={selectedAthlete}
        checkIsSameValue={() => {
          return false;
        }}
      />
    ) : (
      <HorizontalItemsList
        items={days}
        value={day.date.toString()}
        setValue={(value) => {
          setDay({ label: '', date: dayjs(value) });
          setDateFrom(dayjs(value).startOf('day'));
          setDateTo(dayjs(value).endOf('day'));
          setSelectedExercises([]);
        }}
        checkIsSameValue={(value: string) => {
          return dayjs(value).isSame(dayjs(day.date), 'day');
        }}
        dayView
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
            commonService.date.getWeekDays(newDay).map(({ label, date }) => ({
              label,
              value: date.toString(),
              sublabel: commonService.date.format(date, {
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
        <>
          <HorizontalItems />
          <GroupCycleInfo
            smallDisplay
            group={group}
            cycle={cycle}
            week={week}
          />
          <PeriodSelect smallDisplay />
        </>
      ) : (
        <Box
          display="flex"
          width="100%"
          justifyContent="space-around"
          alignItems="flex-start"
        >
          <Box width="25%">
            <PeriodSelect />
          </Box>
          <Box width="50%">
            <HorizontalItems />
          </Box>
          <Box width="25%">
            <GroupCycleInfo group={group} cycle={cycle} week={week} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
