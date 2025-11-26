import { Box, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts';

import useWellnessChartUtils from './hooks/use-chart-utils';
import useWellnessReportData from './hooks/use-data';
import type { MetricConfig } from './types/wellness-metrics.type';
import { theme } from '@/app/style';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
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

  const { rows, avgValue, last10DayAvgValue } = useWellnessReportData(
    members,
    todaysWellness,
    metricConfig
  );

  const safeWidth = Number.isFinite(width) && width > 0 ? width : 450;

  const { colorMapValues, colorMapColors, containersWidth } =
    useWellnessChartUtils(rows, safeWidth);

  const MIN_BAR_WIDTH = 80;

  const barCount = rows.length;
  const chartWidth = Math.max(safeWidth, barCount * MIN_BAR_WIDTH);

  if (
    !Number.isFinite(chartWidth) ||
    chartWidth <= 0 ||
    !Number.isFinite(height)
  ) {
    // avoid rendering with invalid dimensions
    console.log('Invalid chart dimensions', chartWidth, height);
    return null;
  }

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
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderBottom: 'none',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Typography
          variant="h6"
          textAlign="center"
          lineHeight={1}
          fontSize={12}
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
          <Box sx={{ width: chartWidth }}>
            <BarChart
              width={chartWidth}
              height={height}
              dataset={rows}
              hideLegend
              series={[
                {
                  dataKey: 'value',
                  label: metricConfig.title,
                },
              ]}
              xAxis={[
                {
                  scaleType: 'band',
                  dataKey: 'label',
                  categoryGapRatio: 0.5,
                  barGapRatio: 0.5,
                  colorMap: {
                    type: 'ordinal',
                    values: colorMapValues,
                    colors: colorMapColors,
                    unknownColor: theme.palette.primary.main,
                  },
                  tickLabelInterval: () => true,
                  height: 80,
                  tickLabelStyle: {
                    angle: -90,
                    textAnchor: 'end',
                  },
                  valueFormatter: (label, context) =>
                    context.location === 'tick'
                      ? String(label).split(' ').slice(0, 2).join('\n')
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
