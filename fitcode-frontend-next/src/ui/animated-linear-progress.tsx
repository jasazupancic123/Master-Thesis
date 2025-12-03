import type { LinearProgressProps } from '@mui/material';
import { LinearProgress } from '@mui/material';
import { useEffect, useState } from 'react';

type AnimatedLinearProgressProps = LinearProgressProps & {
  targetValue: number; // 0–100
  fillerColor?: string;
};

export function AnimatedLinearProgress({
  targetValue,
  fillerColor,
  ...rest
}: AnimatedLinearProgressProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // small delay so it doesn't jump instantly on first paint
    const t = setTimeout(() => {
      setValue(targetValue);
    }, 100);

    return () => clearTimeout(t);
  }, [targetValue]);

  return (
    <LinearProgress
      variant="determinate"
      value={value}
      color="inherit"
      sx={{
        height: 10,
        borderRadius: 5,
        '& .MuiLinearProgress-bar': {
          borderRadius: 5,
          // optional: make transition a bit smoother/longer
          transition: 'transform 0.8s ease-out !important',
        },
        ...rest.sx,
      }}
      {...rest}
    />
  );
}
