import { theme } from '@/app/style';
import { ChildrenProps } from '@/common/type/props.type';
import { SxProps, Typography } from '@mui/material';

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
