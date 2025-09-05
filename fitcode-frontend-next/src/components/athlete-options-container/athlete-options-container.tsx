'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { useRef } from 'react';

interface AthleteOptionsContainerProps {
  items: string[];
  selectedItem: string;
  onClick: (type: string) => void;
}

export default function AthleteOptionsContainer(
  props: AthleteOptionsContainerProps
) {
  const theme = useTheme();
  const selectedTextRef = useRef<HTMLDivElement | null>(null);

  const { items, selectedItem, onClick } = props;
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      sx={{
        backgroundColor: theme.palette.background.light,
        py: 1,
      }}
    >
      {items.map((type) => (
        <Box
          key={type}
          display="flex"
          flexDirection="column"
          alignItems="center" // center the inline-sized text inside the column
          sx={{ width: `calc(100% / ${items.length})` }}
        >
          <Typography
            onClick={() => onClick(type)}
            sx={{
              display: 'inline-block', // shrink to content width
              fontWeight: 'bold',
              fontSize: 12,
              textTransform: 'uppercase',
              cursor: 'pointer',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0, // underline matches text width
                bottom: -4,
                height: 2,
                borderRadius: 2,
                backgroundColor:
                  type === selectedItem
                    ? theme.palette.primary.main
                    : 'transparent',
              },
            }}
          >
            {type}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
