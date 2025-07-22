import { Divider } from '@mui/material';
import { useScreenSize } from '@/store/screen-size-provider';

export default function VerticalLinesBorder() {
  const screenSize = useScreenSize();
  
  return !screenSize.isSmallerThanLaptop ? (
    <>
      <Divider
        orientation="vertical"
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 1200,
        }}
      />
      <Divider
        orientation="vertical"
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 1200,
        }}
      />
    </>
  ) : null;
}
