import { LineChart } from '@mui/x-charts';
import { endOfDay, isBefore } from 'date-fns';
import { useEffect, useState } from 'react';

import { TrainingController } from '@/core/training/training.controller';
import type { UserTrainingRealizationReportItem } from '@/core/training/type/training-report.type';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';

type Props = {
  institutionId: string;
  athleteId: string;
  componentId?: string;
};

const cache = new Map<string, UserTrainingRealizationReportItem[]>();

export default function AthleteTrainingsRealizationChart({
  institutionId,
  athleteId,
  componentId,
}: Props) {
  const { trainings } = useDashboard();
  const [data, setData] = useState<UserTrainingRealizationReportItem[]>([]);

  useEffect(() => {
    const key = `${institutionId}-${athleteId}-${componentId ?? 'all'}`;
    if (cache.has(key)) {
      setData(cache.get(key)!);
      return;
    }

    const fetchData = async () => {
      const report =
        await TrainingController.getInstance().getUserTrainingsRealizationReport(
          institutionId,
          athleteId,
          componentId
        );

      const prescribed = trainings.filter(
        (t) =>
          t.membersIds.includes(athleteId) &&
          isBefore(t.from, endOfDay(new Date()))
      );

      const merged: UserTrainingRealizationReportItem[] = prescribed.map(
        (t) => {
          const match = report.find((r) => r.trainingId === t.id);
          return {
            trainingId: t.id,
            from: new Date(t.from),
            to: new Date(t.to),
            realization: match
              ? lib.common.number.roundToDecimal(match.realization * 100, 2)
              : 0,
          };
        }
      );

      merged.sort((a, b) => a.from.getTime() - b.from.getTime());
      cache.set(key, merged);
      setData(merged);
    };

    fetchData();
  }, [institutionId, athleteId, componentId, trainings]);

  return (
    <LineChart
      dataset={data}
      xAxis={[
        {
          scaleType: 'time',
          dataKey: 'from',
          label: '',
          valueFormatter: (v: Date) =>
            v instanceof Date
              ? v.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : String(v),
        },
      ]}
      yAxis={[
        {
          min: 0,
          max: 100,
          label: '',
          valueFormatter: (v: number) => `${Math.round(v)}%`,
        },
      ]}
      series={[
        {
          dataKey: 'realization',
          label: 'Realization Per Training For User (%)',
          showMark: true, // show point markers
          curve: 'linear',
        },
      ]}
      width={650}
      height={350}
      margin={{ top: 40, bottom: 60, left: 60, right: 20 }}
    />
  );
}
