import { useTheme } from '@mui/material';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Training } from '@/core/training/type/training.type';

interface Props {
  trainings: Training[];
}

export default function TrainingsTimeChart({ trainings }: Props) {
  const theme = useTheme();

  const data = useMemo(() => {
    return trainings.map((t) => {
      const date = new Date(t.from);
      const label = `${date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      })} ${date.getHours() < 12 ? 'AM' : 'PM'}`;

      const totalExercises = t.components.reduce((acc, comp) => {
        return (
          acc +
          comp.supersets.reduce(
            (sAcc, superset) => sAcc + (superset.exercises?.length || 0),
            0
          )
        );
      }, 0);

      return { label, totalExercises };
    });
  }, [trainings]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />

        <XAxis
          dataKey="label"
          tick={{ fill: theme.palette.text.primary }}
          stroke={theme.palette.text.secondary}
        >
          <Label
            value="Training Date (AM / PM)"
            offset={-25}
            position="insideBottom"
            style={{ fill: theme.palette.text.primary, fontSize: 14 }}
          />
        </XAxis>

        <YAxis
          tick={{ fill: theme.palette.text.primary }}
          stroke={theme.palette.text.primary}
          allowDecimals={false}
        >
          <Label
            value="Number of Exercises"
            angle={-90}
            position="insideLeft"
            style={{
              textAnchor: 'middle',
              fill: theme.palette.text.primary,
              fontSize: 14,
            }}
          />
        </YAxis>

        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 8,
            border: `1px solid ${theme.palette.divider}`,
          }}
          labelStyle={{ color: theme.palette.text.primary }}
        />

        <Legend
          verticalAlign="top"
          align="right"
          wrapperStyle={{
            paddingBottom: 10,
            color: theme.palette.text.primary,
            fontSize: 13,
          }}
        />

        <Line
          name="Total Exercises"
          type="monotone"
          dataKey="totalExercises"
          stroke={theme.palette.primary.main}
          strokeWidth={2.5}
          dot={{ r: 4, fill: theme.palette.primary.main }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
