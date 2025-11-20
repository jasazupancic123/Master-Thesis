import dayjs from 'dayjs';

import { theme } from '@/app/style';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

type Props = {
  groupId?: string;
  selectedUserId?: string;
};

type WellnessMetric = 'sleep' | 'fatigue' | 'soreness';

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
