import {
  Box,
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { BarChart, LineChart } from '@mui/x-charts';
import { startOfDay } from 'date-fns';
import { useState } from 'react';

import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import dayjs from 'dayjs';
import { theme } from '@/app/style';
import { WellnessZScore } from '@/core/profile/type/wellness.type';

type Props = {
  groupId?: string;
  selectedUserId?: string;
};

type WellnessMetric = 'sleep' | 'fatigue' | 'soreness';

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

type MetricConfig = {
  key: WellnessMetric;
  zKey: 'sleepZScore' | 'fatigueZScore' | 'sorenessZScore';
  title: string;
  unit?: string;
};

export default function WellnessReport(props: Props) {
  const { wellness } = useMain();
  const { selectedInstitution } = useDashboard();

  const { groupId, selectedUserId } = props;

  const group = selectedInstitution?.groups?.find((g) => g.id === groupId);
  const members = selectedUserId
    ? (group?.members || []).filter((m) => m.uid === selectedUserId)
    : group?.members || [];

  const todaysWellness = wellness.filter((w) => {
    return dayjs(w.date).isSame(dayjs(), 'day');
  });

  console.log('wellness', wellness);
  console.log('todaysWellness', todaysWellness);

  const metricConfigs: MetricConfig[] = [
    { key: 'sleep', zKey: 'sleepZScore', title: 'Sleep', unit: 'h' },
    { key: 'fatigue', zKey: 'fatigueZScore', title: 'Fatigue' },
    { key: 'soreness', zKey: 'sorenessZScore', title: 'Soreness' },
  ];

  const buildChartData = (metric: MetricConfig) => {
    const xAxisData: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    todaysWellness.forEach((w: any) => {
      const member = members.find((m: any) => m.uid === w.userId);
      const label = member?.displayName || member?.email || w.id; // fallback

      xAxisData.push(label);
      values.push(w[metric.key] ?? 0);

      const z = (w as any)[metric.zKey] ?? 0;
      const absZ = Math.abs(z);

      let color = theme.palette.success.main;
      if (absZ >= 2) color = theme.palette.error.main;
      else if (absZ >= 1) color = theme.palette.warning.main;

      colors.push(color);
    });

    return { xAxisData, values, colors };
  };

  const renderChart = (metric: MetricConfig) => {
    const { xAxisData, values, colors } = buildChartData(metric);

    if (!xAxisData.length) {
      return <Typography variant="body2">No data for today.</Typography>;
    }

    return (
      <BarChart
        height={260}
        xAxis={[
          {
            id: `${metric.key}-x-axis`,
            scaleType: 'band',
            data: xAxisData,
            // Per-bar colors using an ordinal colorMap on the band axis
            colorMap: {
              type: 'ordinal',
              values: xAxisData,
              colors,
            },
          },
        ]}
        yAxis={[
          {
            id: `${metric.key}-y-axis`, // 👈 also unique (good practice)
          },
        ]}
        series={[
          {
            data: values,
            label: metric.unit
              ? `${metric.title} (${metric.unit})`
              : metric.title,
          },
        ]}
        grid={{ vertical: true }}
        margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
      />
    );
  };

  return <></>;

  //   return (
  //     <Box
  //       width="100%"
  //       display="flex"
  //       flexWrap="wrap"
  //       alignItems="space-between"
  //       gap={2}
  //     >
  //       {metricConfigs.map((metric, index) => (
  //         <ChartCard key={index} title={metric.title + ' (today)'}>
  //           {renderChart(metricConfigs[0])}
  //         </ChartCard>
  //       ))}
  //     </Box>
  //   );
}
