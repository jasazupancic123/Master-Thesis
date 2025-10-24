import { Check } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { TooltipContentProps } from 'recharts';

import { DEFAULT_CHART_PARAMS, graphColorMap } from './chart';
import { theme } from '@/app/style';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function CustomTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<number, string>) {
  const { selectedAthleteCompletedWorkloads } = useTrainerDayView();

  const isVisible = active && payload && payload.length;
  const p = payload[0];

  console.log('payload', payload);
  console.log('p', p);

  if (!p || !p.payload) return null;

  const completed = selectedAthleteCompletedWorkloads.some(
    (wl) =>
      wl.trainingId === p.payload.trainingId &&
      wl.componentId === p.payload.componentId &&
      wl.exerciseId === p.payload.exerciseId
  );

  return (
    <Box
      key={label}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="flex-start"
      zIndex={100000}
      sx={{
        p: 1,
        borderRadius: '4px',
        backgroundColor: 'background.dark',
        visibility: isVisible ? 'visible' : 'hidden',
        textAlign: 'center',
        border: '1px solid #FFFFFF',
      }}
    >
      <Typography textAlign="center">{label}</Typography>
      {Array.from({ length: 2 }).map((_, i) => {
        let found = false;

        for (const dataKey of DEFAULT_CHART_PARAMS.slice(i)) {
          if (found) return null;

          const fullValue =
            p.payload[`${dataKey}FullValue`] || p.payload[dataKey];

          if (!fullValue) return null;
          const color = graphColorMap[dataKey];
          found = true;

          return (
            <Box
              key={i}
              display="flex"
              justifyContent="flex-start"
              alignItems="center"
              gap={1}
            >
              <Box
                width={10}
                height={10}
                bgcolor={color}
                sx={{ borderRadius: '50%' }}
              />
              <Typography sx={{ color: color }}>{fullValue}</Typography>
            </Box>
          );
        }
      })}

      {completed && (
        <Typography
          textAlign="center"
          fontSize={12}
          sx={{
            color: theme.palette.success.main,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Check sx={{ fontSize: 12 }} /> Completed
        </Typography>
      )}
    </Box>
  );
}
