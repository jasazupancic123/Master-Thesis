import { Box } from '@mui/material';

interface Props {
  src: string;
  width?: number;
  height?: number;
}

export default function ImgIcon(props: Props) {
  const { src, width = 16, height = 16 } = props;

  return (
    <Box
      component="img"
      width={width}
      height={height}
      src={src}
      sx={{
        objectFit: 'contain',
      }}
    />
  );
}
