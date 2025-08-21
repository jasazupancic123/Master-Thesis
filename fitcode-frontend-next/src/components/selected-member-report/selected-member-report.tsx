import CloseIcon from '@mui/icons-material/Close';
import { Avatar, Box, Typography } from '@mui/material';
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
import setupChartData, { colorForZ } from './state';
import { COMMON_COLORS } from '@/common/constant/color.constant';
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

  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [wellnessChartData, setWellnessChartData] = useState<
    WellnessChartData[]
  >(
    [
      WellnessChartDataType.FATIGUE,
      WellnessChartDataType.SORENESS,
      WellnessChartDataType.SLEEP,
    ].map((metric) => ({
      metric,
      today: null,
      yesterday: null,
      zScoreToday: null,
      zScoreYesterday: null,
    }))
  );

  useEffect(() => {
    if (!selectedAthlete) return;

    setupChartData(
      wellness,
      selectedAthlete,
      setUserWeight,
      setWellnessChartData
    );
  }, [selectedAthlete]);

  return (
    <Box
      width={screenSize.isSmallerThanLaptop ? '100%' : '70%'}
      display="flex"
      flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
      justifyContent="center"
      alignItems="center"
      px={screenSize.isSmallerThanLaptop ? 0 : 7}
      position="relative"
      gap={1}
      my={screenSize.isSmallerThanLaptop ? 1 : 0}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        mr={screenSize.isSmallerThanLaptop ? 0 : 0.5}
      >
        <Avatar
          className="avatar-border"
          src={
            groupMembers.find((m) => m.id === selectedAthlete?.uid)
              ?.profileImageUrl || '/user_avatar.png'
          }
          sx={{
            width: 60,
            height: 60,
          }}
        />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          textAlign="center"
          fontSize={20}
          sx={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {selectedAthlete?.displayName}
        </Typography>
        <Typography
          textAlign="center"
          sx={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: theme.palette.text.secondary,
          }}
        >
          {selectedAthlete?.email}
        </Typography>
        <Typography
          textAlign="center"
          sx={{
            borderRadius: 2,
            color: theme.palette.text.secondary,
          }}
        >
          {userWeight || 'N/A'}
          {'\n'}kg
        </Typography>
      </Box>
      <Box
        width={screenSize.isMobile ? `${window.innerWidth - 50}px` : 350}
        display="flex"
        flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
        alignItems="center"
        justifyContent="center"
      >
        <ResponsiveContainer
          height={133.5}
          style={{ marginRight: screenSize.isMobile ? 20 : 0 }}
        >
          <BarChart
            data={wellnessChartData}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            barGap={4}
            barCategoryGap="0%"
          >
            <XAxis
              dataKey="metric"
              interval={0}
              padding={{ left: 0, right: 0 }} // kill extra side padding
              tick={{ fill: '#FFFFFF', fontSize: 12 }}
              allowDuplicatedCategory={false}
            />
            <YAxis
              type="number"
              domain={[0, 10]}
              ticks={[2, 4, 6, 8, 10]}
              interval={0}
              allowDecimals={false}
              tick={{ fill: '#FFFFFF', fontSize: 12 }}
              tickMargin={6}
              width={28} // keep Y-axis compact so it doesn’t eat space
            />

            <Tooltip
              content={CustomBarTooltip}
              wrapperStyle={{ outline: 'none' }}
              cursor={false}
            />

            <Bar
              dataKey="yesterday"
              name="Yesterday"
              barSize={10}
              radius={[4, 4, 0, 0]}
            >
              {wellnessChartData.map((row) => (
                <Cell
                  key={`y-${row.metric}`}
                  fill={colorForZ(row, 'yesterday', theme)}
                />
              ))}
            </Bar>

            <Bar
              dataKey="today"
              name="Today"
              barSize={10}
              radius={[4, 4, 0, 0]}
            >
              {wellnessChartData.map((row) => (
                <Cell
                  key={`t-${row.metric}`}
                  fill={colorForZ(row, 'today', theme)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <Box
          display="flex"
          flexDirection={screenSize.isSmallerThanLaptop ? 'row' : 'column'}
          gap={1}
        >
          {wellnessChartData.some(
            (w) =>
              (w.zScoreToday !== null && w.zScoreToday !== undefined) ||
              (w.zScoreYesterday !== null && w.zScoreYesterday !== undefined)
          )
            ? [
                { color: COMMON_COLORS.blue, label: 'Stable' },
                { color: COMMON_COLORS.yellow, label: 'Moderate' },
                { color: COMMON_COLORS.red, label: 'Outlier' },
              ].map((item) => (
                <Box
                  key={item.label}
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                >
                  <Box
                    width={10}
                    height={10}
                    borderRadius="50%"
                    bgcolor={item.color}
                  />
                  <Typography fontSize={14}>{item.label}</Typography>
                </Box>
              ))
            : null}
        </Box>
      </Box>
      <Box
        position="absolute"
        top={0}
        right={screenSize.isSmallerThanLaptop ? 20 : 100}
        onClick={() => setSelectedAthlete(undefined)}
        sx={{ cursor: 'pointer' }}
      >
        <CloseIcon />
      </Box>
    </Box>
  );
}
