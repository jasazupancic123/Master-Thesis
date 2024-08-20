import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { SxProps, Tooltip } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';

interface Props {
  items: { label: string; value: string; sublabel?: string; }[];
  value: string;
  setValue: (value: string) => void;
  getBackgroundColor?: (value: string, itemValue: string) => string;
  sx?: SxProps;
}

export default function Circles(props: Props) {
  return <Box sx={{
    pb: 3,
    display: 'flex',
    justifyContent: 'center',
    borderBottomRightRadius: '20px',
    borderBottomLeftRadius: '20px',
    backgroundColor: '#1A2B3C',
    ...props.sx,
  }}>
    <Stack direction="row" spacing={1}>
      {props.items.map((item, i) => (
        <Box key={i}>
          <Tooltip title={item.label}>
            <Box
              onClick={() => props.setValue(item.value)}
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                cursor: 'pointer',
                backgroundColor: props.getBackgroundColor ? props.getBackgroundColor(props.value, item.value) : (props.value === item.value ? '#1EB980' : 'rgba(255, 255, 255, 0.1)'),
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>{item.label}</Typography>
            </Box>
          </Tooltip>

          {item.sublabel && (
            <Typography variant="caption">
              {item.sublabel}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  </Box>;
}