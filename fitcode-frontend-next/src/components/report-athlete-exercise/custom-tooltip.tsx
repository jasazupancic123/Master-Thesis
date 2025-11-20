import { Box, Typography } from '@mui/material';
import {
  ChartsTooltipContainer,
  useAxesTooltip,
  useSeries,
} from '@mui/x-charts';
import dayjs from 'dayjs';
import { theme } from '@/app/style';
import { Workload } from '@/core/training/type/workload.type';
import { useDashboard } from '@/store/dashboard.provider';

interface Props {
  openWorkloadModal: boolean;
  data: Workload[];
  reportType: 'single' | 'comparison';
  groupByTraining: boolean;
}

export default function AthleteExerciseChartTooltip(props: Props) {
  const { trainings } = useDashboard();

  const { openWorkloadModal, data, reportType, groupByTraining } = props;

  if (openWorkloadModal) return null;

  const axes = useAxesTooltip();
  const series = useSeries();

  const lineSeries = series.line;

  if (!axes || !lineSeries) {
    return null;
  }

  const index = axes[0].dataIndex;

  if (index === undefined) return null;

  const workload = data[index];

  if (!workload) return null;

  const training = trainings.find((t) => t.id === workload.trainingId);

  if (training) workload.from = training.from;

  const tooltipValuesData: { label: string; value: number; color: string }[] =
    [];

  for (const s of Object.values(lineSeries.series)) {
    tooltipValuesData.push({
      label: (s.label as string) || '',
      value: s.data[index] as number,
      color: s.color,
    });
  }

  const prettyLabel = (label: string) => {
    if (!label) return '';
    if (label === 'loadKg') return 'Load (kg)';
    if (label === 'reps') return 'Reps';
    if (label === 'loadKgR') return 'Load R (kg)';
    if (label === 'repsR') return 'Reps R';
    return label;
  };

  const prettyValue = (value: number, label: string) => {
    const isInt = value % 1 === 0;

    if (!isInt) return value.toFixed(2);
    else return value;
  };

  return (
    <ChartsTooltipContainer
      id="athlete-exercise-chart-tooltip"
      sx={{
        p: 1,
        borderRadius: 2,
        boxShadow: 3,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        minWidth: 180,
      }}
    >
      {/* Main value line */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        gap={0.5}
      >
        <Typography>
          {dayjs(workload.from).format('MMM DD. A')}
          {reportType === 'single' && !groupByTraining
            ? ` - set ${workload.setNumber}`
            : ''}
        </Typography>
        {tooltipValuesData.map(({ label, value, color }, idx) => (
          <Box key={idx} display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: color,
              }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{ lineHeight: 1.1, color: theme.palette.text.primary }}
              >
                {prettyLabel(label)} <b>{prettyValue(value, label)}</b>
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </ChartsTooltipContainer>
  );
}
