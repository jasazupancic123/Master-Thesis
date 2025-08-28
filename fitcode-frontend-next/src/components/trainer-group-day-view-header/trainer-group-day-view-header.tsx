import { MoreVert } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

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
    wellness,
    setSelectedExercises,
  } = useTrainerDayViewContext();

  useEffect(() => {
    // if there's only one training on day, always first show the period with the training
    const todaysTrainings = trainings.filter((t) =>
      dayjs(t.from).isSame(day.date, 'day')
    );
    let period: 'AM' | 'PM' = new Date().getHours() >= 12 ? 'PM' : 'AM';
    if (todaysTrainings.length === 1) {
      period = new Date(todaysTrainings[0].from).getHours() >= 12 ? 'PM' : 'AM';
    }

    setSelectedPeriod(period);
  }, [day]);

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

  interface GroupInfoProps {
    smallDisplay?: boolean;
  }

  function GroupCycleInfo(props: GroupInfoProps) {
    const { smallDisplay } = props;
    return (
      <Box
        width="100%"
        display="flex"
        justifyContent={smallDisplay ? 'center' : 'flex-end'}
        gap={screenSize.isSmallerThanLaptop ? 0 : 4}
        position="relative"
      >
        <Box display="flex" flexDirection="column" mt={1}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems={
              screenSize.isMobile || screenSize.isSmallTablet
                ? 'center'
                : 'flex-end'
            }
            justifyContent="flex-start"
            gap={0.5}
            sx={{
              px: smallDisplay ? 2 : undefined,
            }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="right"
              fontSize={12}
              sx={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {group.name}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="right"
              fontSize={12}
              sx={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Week {week} / {cycle?.name || 'No cycle'}
            </Typography>
          </Box>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          sx={{
            mt: !smallDisplay ? -1.33 : 0,
            position: smallDisplay ? 'absolute' : undefined,
            right: smallDisplay ? 1 : undefined,
            top: smallDisplay ? 6 : undefined,
          }}
          gap={0.5}
        >
          <IconButton
            sx={{
              p: 0,
              m: 0,
              mt: screenSize.isMobile ? undefined : 2.3,
            }}
          >
            <MoreVert fontSize="medium" />
          </IconButton>
        </Box>
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
          <GroupCycleInfo smallDisplay />
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
            <GroupCycleInfo />
          </Box>
        </Box>
      )}
    </Box>
  );
}
