'use client';

import { Box, Typography, useTheme } from '@mui/material';

import TrapezoidTitle from './trapezoid-title';

interface AthleteOptionsContainerProps {
  items: string[];
  title: string;
  selectedItem: string;
  onClick: (type: string) => void;
}

export default function AthleteOptionsContainer(
  props: AthleteOptionsContainerProps
) {
  const theme = useTheme();

  const { items, title, selectedItem, onClick } = props;
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
          {type === selectedItem && i === 0 && (
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                width: 4,
                height: 16,
                borderRadius: 5,
              }}
            />
          )}

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

          {type === selectedItem && i === 1 && (
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                width: 4,
                height: 16,
                borderRadius: 5,
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
