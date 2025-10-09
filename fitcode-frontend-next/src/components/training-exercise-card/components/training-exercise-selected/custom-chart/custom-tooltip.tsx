import { theme } from '@/app/style';
import { GRAPH_COLORS } from '@/common/constant/color.constant';
import { ParamType } from '@/controller/component/enum/param.enum';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { Check } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { TooltipContentProps } from 'recharts';

export const getParamTypeColor = (type: ParamType) => {
  switch (type) {
    case ParamType.IntWork1:
      return GRAPH_COLORS[0];
    case ParamType.VolWork1:
      return GRAPH_COLORS[1];
    case ParamType.IntWork2:
      return GRAPH_COLORS[2];
    case ParamType.VolWork2:
      return GRAPH_COLORS[3];
  }
  return 'transparent';
};

export default function CustomTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<number, string>) {
  const { selectedAthleteCompletedWorkloads } = useTrainerDayViewContext();

  const isVisible = active && payload && payload.length;

  const p = payload[0];
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
      {Array.from({ length: 4 }).map((_, i) => {
        let found = false;
        for (const dataKey of [
          ParamType.IntWork1,
          ParamType.VolWork1,
          ParamType.IntWork2,
          ParamType.VolWork2,
        ].slice(i)) {
          if (found) return null;

          const fullValue =
            p.payload[`${dataKey}FullValue`] || p.payload[dataKey];

          if (!fullValue) return null;

          const color = getParamTypeColor(dataKey);
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
                sx={{
                  borderRadius: '50%',
                }}
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
