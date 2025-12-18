import { theme } from '@/app/style';
import { Box, SxProps, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  sx?: SxProps;
}

export default function AlertFrame(props: Props) {
  const { title, icon, subtitle, sx } = props;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width={
        typeof window !== 'undefined'
          ? Math.min(window.innerWidth * 0.8, 400)
          : 400
      }
      minHeight={200}
      sx={{
        borderRadius: 4,
        border: `1px solid ${theme.palette.background.lightBorder}`,
        backgroundColor: theme.palette.background.dark,
        p: 2,
        ...sx,
      }}
      gap={1}
    >
      {icon}
      <Typography fontSize={16} fontWeight={800} textAlign="center" mt={2}>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          textAlign="center"
          fontSize={14}
          sx={{
            color: theme.palette.background.lightBorder,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
