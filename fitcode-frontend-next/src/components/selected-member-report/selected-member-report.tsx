import CloseIcon from '@mui/icons-material/Close';
import { Avatar, Box, Tooltip as MuiTooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import CustomBarTooltip from '../selected-member-report-custom-tooltip/selected-member-report-custom-tooltip';
import setupChartData from './state';
import FatigueIcon from '../../assets/icons/fatigue.svg';
import SleepIcon from '../../assets/icons/sleep.svg';
import SorenessIcon from '../../assets/icons/soreness.svg';
import { COLOR } from '@/common/constant/color.constant';
import { WellnessChartDataType } from '@/controller/user/enum/wellness-chart-data-type.enum';
import type { UserEntity } from '@/controller/user/type/user.type';
import type { WellnessChartData } from '@/controller/user/type/wellness.type';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface SelectedMemberReportProps {
  groupMembers: UserEntity[];
}

export default function SelectedMemberReport(props: SelectedMemberReportProps) {
  const { groupMembers } = props;

  const theme = useTheme();
  const screenSize = useScreenSize();

  const { wellness, selectedAthlete, setSelectedAthlete } =
    useTrainerDayViewContext();

  const [wellnessChartData, setWellnessChartData] = useState<
    WellnessChartData[]
  >(
    [
      WellnessChartDataType.SLEEP,
      WellnessChartDataType.SORENESS,
      WellnessChartDataType.FATIGUE,
    ].map((metric) => ({
      metric,
      today: null,
      zScore: null,
    }))
  );

  useEffect(() => {
    if (!selectedAthlete) return;

    setupChartData(wellness, selectedAthlete, setWellnessChartData);
  }, [selectedAthlete]);

  const getBarChartBorderColor = (metric: WellnessChartDataType) => {
    switch (metric) {
      case WellnessChartDataType.SLEEP:
        return COLOR[0];
      case WellnessChartDataType.SORENESS:
        return COLOR[1];
      case WellnessChartDataType.FATIGUE:
        return COLOR[2];
      default:
        return '';
    }
  };

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      position="relative"
      gap={1}
      my={screenSize.isMobile ? 1 : 0}
      flexDirection={screenSize.isMobile ? 'column' : 'row'}
    >
      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        display="flex"
      ></Box>
      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <MuiTooltip title={selectedAthlete?.email}>
          <Avatar
            className="avatar-border"
            src={
              groupMembers.find((m) => m.id === selectedAthlete?.uid)
                ?.profileImageUrl || '/user_avatar.png'
            }
            sx={{
              width: 80,
              height: 80,
              cursor: 'pointer',
            }}
            onClick={() => setSelectedAthlete(undefined)}
          />
        </MuiTooltip>
      </Box>
      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        display="flex"
        justifyContent={screenSize.isMobile ? 'center' : 'flex-end'}
        alignItems="center"
      >
        <Box
          width={90}
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="relative"
          sx={{
            mt: screenSize.isMobile ? 2 : 0,
          }}
        >
          <Box
            width={`100%`}
            display="flex"
            justifyContent="center"
            alignItems="center"
            position="absolute"
            sx={{
              top: -12,
              right: 0,
              transform: screenSize.isMobile ? undefined : 'translateX(-50%)',
            }}
            gap={0.9}
          >
            <Typography
              textAlign="center"
              fontWeight="medium"
              fontSize={12}
              color={theme.palette.background.lightBorder}
            >
              Wellness
            </Typography>
          </Box>
          {wellnessChartData.some((data) => data.today !== null) ? (
            <>
              <ResponsiveContainer
                height={133.5}
                style={{
                  transform: screenSize.isMobile
                    ? undefined
                    : 'translateX(-50%)',
                }}
              >
                <BarChart
                  data={wellnessChartData}
                  margin={{ top: 8, bottom: 0 }}
                  barGap={0}
                  barCategoryGap="0px"
                  style={{
                    position: 'relative',
                  }}
                >
                  <YAxis
                    type="number"
                    domain={[0, 10]}
                    ticks={[2, 4, 6, 8, 10]}
                    interval={0}
                    allowDecimals={false}
                    tick={<></>}
                    width={0}
                  />
                  <XAxis
                    dataKey="metric"
                    interval={0}
                    padding={{ left: 0, right: 0 }}
                    tick={<></>}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    content={CustomBarTooltip}
                    wrapperStyle={{ outline: 'none' }}
                    cursor={false}
                  />

                  <Bar
                    dataKey="today"
                    name="Today"
                    barSize={10}
                    radius={[2, 2, 0, 0]}
                  >
                    {wellnessChartData.map((row) => (
                      <Cell
                        id={`t-${row.metric}`}
                        key={`t-${row.metric}`}
                        fill={theme.palette.background.light}
                        stroke={getBarChartBorderColor(row.metric)}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Box
                width={`100%`}
                display="flex"
                justifyContent="center"
                alignItems="center"
                position="absolute"
                sx={{
                  bottom: 5,
                  right: 0,
                  transform: screenSize.isMobile
                    ? undefined
                    : 'translateX(-50%)',
                }}
                gap={0.9}
              >
                <SleepIcon
                  fontSize="small"
                  style={{ transform: 'translateX(-50%)' }}
                />
                <SorenessIcon fontSize="small" />
                <FatigueIcon
                  fontSize="small"
                  style={{ transform: 'translateX(+50%)' }}
                />
              </Box>
            </>
          ) : (
            <Box
              width="100%"
              height={screenSize.isMobile ? 60 : 133.5}
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{
                transform: screenSize.isMobile ? undefined : 'translateX(-50%)',
              }}
            >
              <Typography textAlign="center" fontWeight="medium" fontSize={12}>
                No wellness today
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box
        position="absolute"
        top={-10}
        right={screenSize.isMobile ? 20 : 5}
        onClick={() => setSelectedAthlete(undefined)}
        sx={{ cursor: 'pointer' }}
      >
        <CloseIcon />
      </Box>
    </Box>
  );
}
