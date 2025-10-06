import type { SxProps } from '@mui/material';
import { Typography } from '@mui/material';

import { theme } from '@/app/style';
import type { ChildrenProps } from '@/common/type/props.type';

interface IndexPageTitleTextProps {
  sx: SxProps;
}

export default function IndexPageTitleText(
  props: IndexPageTitleTextProps & ChildrenProps
) {
  const { sx, children } = props;

  return (
    <Typography
      fontSize={26}
      fontWeight={1000}
      lineHeight={1}
      sx={{
        textTransform: 'uppercase',
        color: theme.palette.primary.main,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}
