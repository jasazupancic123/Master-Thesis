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

  return (
    <div
      style={{
        background: theme.palette.background.paper,
        padding: '6px 8px',
        borderRadius: 8,
      }}
    >
      <Typography
        sx={{ width: '100%', opacity: 0.8, textAlign: 'center' }}
        fontSize={14}
      >
        {metric}
      </Typography>

      {payload.map((p) => {
        const item = p;
        const value = item.value as number | null;
        const seriesName = item.name as string; // "Today" / "Yesterday"

        return (
          <Typography key={item.name} fontSize={12}>
            <strong>{seriesName}:</strong> {value === null ? '—' : value}
          </Typography>
        );
      })}
    </div>
  );
}
