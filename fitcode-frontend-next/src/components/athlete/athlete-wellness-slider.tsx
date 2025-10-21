import { Slider } from '@mui/material';
import { useTheme } from '@mui/material';

interface Props {
  value: number;
  setValue: (value: number) => void;
  disabled: boolean;
}

export default function AthleteWellnessSlider({
  value,
  setValue,
  disabled,
}: Props) {
  const theme = useTheme();

  return (
    <Slider
      orientation="horizontal"
      value={value}
      min={1}
      max={10}
      onChange={(_, value) => setValue(value as number)}
      valueLabelDisplay="on"
      disabled={disabled}
      sx={{
        '& .MuiSlider-track': {
          backgroundColor: theme.palette.primary.main,
          border: 'none',
        },
        '& .MuiSlider-thumb': {
          width: 14,
          height: 14,
          backgroundColor: disabled ? 'gray' : theme.palette.primary.main,
        },
        '& .MuiSlider-rail': {
          backgroundColor: '#ffffff',
        },
        '& .MuiSlider-valueLabelOpen': {
          backgroundColor: 'transparent',
          top: 2,
          fontSize: 12,
        },
        '& .MuiSlider-valueLabelOpen:before': {
          display: 'none',
        },
      }}
    />
  );
}
