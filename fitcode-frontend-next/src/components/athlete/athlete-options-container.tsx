'use client';

import { Box, Typography, useTheme } from '@mui/material';

import TrapezoidTitle from './trapezoid-title';
import SimpleCircle from '@/ui/simple-circle';
import { ElapsedTime } from '../training-in-progress/training-in-progress-elapsed-time';

interface Props {
  items: string[];
  title: string;
  selectedItem: string;
  onClick: (type: string) => void;
  startMs?: number; // If this is passed, it's used to show elapsed time
}

export default function AthleteOptionsContainer({
  items,
  title,
  selectedItem,
  onClick,
  startMs,
}: Props) {
  const theme = useTheme();

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.default,
        py: 0.75,
        px: 1,
        borderTop: `3px solid ${theme.palette.primary.main}`,
        position: 'relative',
      }}
    >
      <TrapezoidTitle title={title} />

      {items.map((type, i) => (
        <Box
          key={type}
          display="flex"
          alignItems="center" // center the inline-sized text inside the column
          gap={0.75}
        >
          {type === selectedItem && i === 0 && <SimpleCircle />}

          {i === 1 && startMs !== undefined ? (
            <ElapsedTime startMs={startMs} />
          ) : (
            <Typography
              onClick={() => onClick(type)}
              sx={{
                display: 'inline-block', // shrink to content width
                fontSize: 12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {type}
            </Typography>
          )}

          {type === selectedItem && i === 1 && <SimpleCircle />}
        </Box>
      ))}
    </Box>
  );
}
