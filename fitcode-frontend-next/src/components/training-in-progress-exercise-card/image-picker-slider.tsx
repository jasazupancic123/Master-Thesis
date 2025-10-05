import { Box } from '@mui/material';
import Image from 'next/image';

interface ImagePickerSliderProps {
  images: string[];
  onClick: (index: number) => void;
  width?: number;
}

export default function ImagePickerSlider(props: ImagePickerSliderProps) {
  const { images, onClick, width = 60 } = props;

  const canJustifyCenter = images.length * width < window.innerWidth;

  return (
    <Box
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent={canJustifyCenter ? 'center' : undefined}
      sx={{
        overflowX: 'auto',
        px: 1,
      }}
    >
      {images.map((image, index) => (
        <Image
          key={index}
          src={image}
          alt="Image Picker"
          width={width}
          height={0}
          layout="intrinsic"
          onClick={() => onClick(index)}
        />
      ))}
    </Box>
  );
}
