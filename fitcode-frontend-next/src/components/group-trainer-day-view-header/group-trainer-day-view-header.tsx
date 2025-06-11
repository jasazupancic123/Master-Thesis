import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import Circles from '@/components/circles/circles';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { MenuItem, Select, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React from 'react';
import { useTheme } from '@mui/material';

dayjs.extend(weekOfYear);

const commonService = CommonService.instance;

interface GroupTrainerDayViewHeaderProps {
  day: Day;
  setDay: (day: Day) => void;
  days: { label: string; value: string; sublabel: string }[];
  setDays: (days: { label: string; value: string; sublabel: string }[]) => void;
  week: number;
}

export default function GroupTrainerDayViewHeader(
  props: GroupTrainerDayViewHeaderProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { day, setDay, days, setDays, week } = props;

  const { group, cycle, setDateFrom, setDateTo, setCycle } = useGroup();

  const { selectedAthlete, selectedSubgroup } = useTrainerDayViewContext();
  return (
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
              commonService.date.getWeekDays(newDay).map(({ label, date }) => ({
                label: label[0],
                value: date.toString(),
                // sublabel: screenSize.isSmallerThanLaptop
                //   ? commonService.date.format(date, {
                //       withYear: false,
                //     })
                //   : undefined,
                sublabel: commonService.date.format(date, {
                  withYear: false,
                }),
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
  );
}
