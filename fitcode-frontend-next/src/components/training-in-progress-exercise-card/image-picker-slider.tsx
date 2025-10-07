import { Box } from '@mui/material';
import Image from 'next/image';

import { theme } from '@/app/style';

interface ImagePickerSliderProps {
  images: string[];
  onClick: (index: number) => void;
  currentIndex: number;
  width?: number;
}

export default function ImagePickerSlider(props: ImagePickerSliderProps) {
  const { images, onClick, currentIndex, width = 60 } = props;

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
      gap={0.5}
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
          style={{
            border:
              index === currentIndex
                ? `2px solid ${theme.palette.primary.main}`
                : 'none',
          }}
        />
      ))}
    </Box>
  );
}
