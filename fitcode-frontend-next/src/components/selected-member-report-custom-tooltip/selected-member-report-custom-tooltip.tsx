import { Typography, useTheme } from '@mui/material';
import type { TooltipContentProps } from 'recharts';

export default function CustomBarTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<number, string>) {
  const theme = useTheme();

  if (!active || !payload || payload.length === 0) return null;

  const metric = label as string; // "SORENESS" / "FATIGUE" / "SLEEP"
  const value = payload[0].value;

  return (
    <div
      style={{
        width: 100,
        background: theme.palette.background.paper,
        padding: '6px 8px',
        borderRadius: 8,
      }}
    >
      <Typography
        sx={{ width: '100%', opacity: 0.8, textAlign: 'center' }}
        fontSize={14}
      >
        {metric[0] + metric.slice(1).toLowerCase()}:{' '}
        <strong>{value === null ? '—' : value}</strong>
      </Typography>
    </div>
  );
}
