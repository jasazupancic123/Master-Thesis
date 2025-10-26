import { Circle } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

interface StillnessTextProps {
  isStill: boolean;
}

export default function StillnessText(props: StillnessTextProps) {
  const { isStill } = props;
  const theme = useTheme();

  return (
    <Box
      display="flex"
      justifyContent="flex-end"
      alignItems="center"
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
      }}
      gap={0.5}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'white',
          textShadow: '1px 1px 2px black',
        }}
      >
        Still
      </Typography>
      <Circle
        sx={{
          color: isStill
            ? theme.palette.success.main
            : theme.palette.error.main,
          fontSize: 'small',
        }}
      />
    </Box>
  );
}
