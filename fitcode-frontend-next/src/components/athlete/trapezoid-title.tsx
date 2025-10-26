import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

interface Props {
  title: string;
}

export default function TrapezoidTitle({ title }: Props) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'fit-content',
        px: 4,
        height: 35,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        py: '0px !important',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: theme.palette.primary.main,
          transform: 'perspective(90px) rotateX(-40deg)',
          transformOrigin: 'top center',
          zIndex: 0,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        },
      }}
    >
      <Typography
        fontWeight="bold"
        sx={{
          mt: -0.1,
          fontSize: 14,
          zIndex: 1, // make sure it sits above the background
          color: theme.palette.text.secondary,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
