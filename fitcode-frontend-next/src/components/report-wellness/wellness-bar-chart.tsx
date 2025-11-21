import { BarChart } from '@mui/x-charts';
import { MetricConfig } from './types/wellness-metrics.type';
import { theme } from '@/app/style';
import { WellnessZScore } from '@/core/profile/type/wellness.type';
import { AuthUser } from '@/core/auth/type/user.type';
import { Box, Typography } from '@mui/material';
import useWellnessReportData from './hooks/use-data';
import useWellnessChartUtils from './hooks/use-chart-utils';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  todaysWellness: WellnessZScore[];
  metricConfig: MetricConfig;
  width: number;
  height: number;
  members: AuthUser[];
}

export default function WellnessBarChart(props: Props) {
  const screenSize = useScreenSize();

  const { todaysWellness, metricConfig, width, height, members } = props;

  if (!todaysWellness.length) return null;

  const { rows, avgValue, last10DayAvgValue } = useWellnessReportData(
    members,
    todaysWellness,
    metricConfig
  );

  const { colorMapValues, colorMapColors, wrapLabel, containersWidth } =
    useWellnessChartUtils(rows, width);

  const MIN_BAR_WIDTH = 80;

  const barCount = rows.length;
  const chartWidth = Math.max(width, barCount * MIN_BAR_WIDTH);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {/* Title */}
      <Box
        width={containersWidth}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderTopRightRadius: 8,
          borderTopLeftRadius: 8,
        }}
      >
        <Typography
          variant="h6"
          textAlign="center"
          lineHeight={1}
          sx={{
            py: 1,
            textTransform: 'uppercase',
          }}
        >
          {metricConfig.title}
        </Typography>
      </Box>

      {/* Chart */}
      <Box
        width={containersWidth}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          borderRadius: 2,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          border: `1px solid ${theme.palette.divider}`,
          borderTop: 'none',
          py: 2,
        }}
        gap={0.5}
      >
        {/* Scroll container */}
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            ...styledScrollbarSx(theme),
            pb: screenSize.isTouchDevice ? 1 : undefined,
          }}
        >
          {/* Inner width = scroll area (can be wider than container) */}
          <Box sx={{ width: chartWidth }}>
            <BarChart
              width={chartWidth}
              height={height}
              dataset={rows}
              hideLegend
              xAxis={[
                {
                  scaleType: 'band',
                  dataKey: 'label',
                  colorMap: {
                    type: 'ordinal',
                    values: colorMapValues,
                    colors: colorMapColors,
                    unknownColor: theme.palette.primary.main,
                  },
                  tickLabelInterval: () => true,
                  height: 50,
                  valueFormatter: (label, context) =>
                    context.location === 'tick'
                      ? wrapLabel(String(label), 10)
                      : String(label),
                },
              ]}
              yAxis={[
                {
                  min: 0,
                  max: 10,
                },
              ]}
              borderRadius={4}
              margin={{
                right: 0,
                bottom: 0,
                left: 0,
                top: 10,
              }}
              series={[
                {
                  dataKey: 'value',
                  label: metricConfig.title,
                },
              ]}
            />
          </Box>
        </Box>

        {/* Avg values */}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.5}
        >
          <Typography variant="body2" textAlign="center">
            Today avg: <b>{avgValue ? avgValue.toFixed(2) : 'N/A'}</b>
            <br />
            Last 10 days avg:{' '}
            <b>{last10DayAvgValue ? last10DayAvgValue.toFixed(2) : 'N/A'}</b>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
