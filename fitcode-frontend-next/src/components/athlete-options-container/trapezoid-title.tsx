import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

interface TrapezoidTitleProps {
  title: string;
}

export default function TrapezoidTitle(props: TrapezoidTitleProps) {
  const theme = useTheme();

  const { title } = props;
  return (
    <Box
      sx={{
        position: 'absolute',
        top: -3,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'fit-content',
        px: 4,
        height: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: theme.palette.background.textBackground,
          transform: 'perspective(90px) rotateX(-40deg)',
          transformOrigin: 'top center',
          zIndex: 0,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        },
      }}
    >
      <Typography
        sx={{
          mt: 0.25,
          fontSize: 14,
          zIndex: 1, // make sure it sits above the background
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
