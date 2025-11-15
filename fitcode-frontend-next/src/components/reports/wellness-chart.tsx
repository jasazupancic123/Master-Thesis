import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { startOfDay } from 'date-fns';
import { useState } from 'react';

import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

type Props = {
  groupId?: string;
  selectedUserId?: string;
};

type WellnessMetric = 'sleep' | 'fatigue' | 'soreness';

export default function WellnessChart({ groupId, selectedUserId }: Props) {
  const { wellness } = useMain();
  const { selectedInstitution } = useDashboard();

  const [metric, setMetric] = useState<WellnessMetric>('sleep');

  const group = selectedInstitution?.groups?.find((g) => g.id === groupId);
  const members = selectedUserId
    ? (group?.members || []).filter((m) => m.uid === selectedUserId)
    : group?.members || [];

  const dataset = wellness.map((w) => ({
    date: startOfDay(new Date(w.date)),
    [w.userId]: w[metric],
  }));

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <LineChart
        dataset={dataset}
        xAxis={[
          {
            dataKey: 'date',
            scaleType: 'time',
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
        yAxis={[{ min: 0, max: 10, label: '' }]}
        series={members.map((user) => ({
          dataKey: user.uid,
          label: user.displayName || 'Unknown',
        }))}
        width={650}
        height={350}
        margin={{ top: 40, bottom: 60, left: 60, right: 20 }}
      />

      {/* Metric selector */}
      <FormControl sx={{ minWidth: 150, marginBottom: 2 }}>
        <InputLabel id="metric-select-label">Metric</InputLabel>

        <Select
          labelId="metric-select-label"
          value={metric}
          label="Metric"
          onChange={(e) => setMetric(e.target.value as WellnessMetric)}
        >
          <MenuItem value="sleep">Sleep</MenuItem>
          <MenuItem value="fatigue">Fatigue</MenuItem>
          <MenuItem value="soreness">Soreness</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
