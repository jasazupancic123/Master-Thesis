import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { theme } from '@/app/style';
import type { RepImage } from '@/controller/training/type/training-exercise.type';
import ImagePickerSlider from './image-picker-slider';

interface ImageGalleryProps {
  images: string[] | RepImage[];
  enableImagePickerSlider?: boolean;
}

export default function ImageGallery(props: ImageGalleryProps) {
  const { images, enableImagePickerSlider = false } = props;

  const [currentIndex, setCurrentIndex] = useState(0);

  const width = Math.min(600, window.innerWidth);

  // check if it's array of strings or array of objects
  function isRepImageArray(
    images: string[] | RepImage[]
  ): images is RepImage[] {
    return (
      Array.isArray(images) &&
      images.length > 0 &&
      typeof images[0] === 'object' &&
      'repNumber' in images[0] &&
      'url' in images[0]
    );
  }

  if (!images || images.length === 0) return null;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
    >
      <Typography textAlign="center" fontSize={18}>
        Gallery
      </Typography>
      {enableImagePickerSlider && (
        <ImagePickerSlider
          images={isRepImageArray(images) ? images.map((i) => i.url) : images}
          currentIndex={currentIndex}
          onClick={setCurrentIndex}
        />
      )}

      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          position: 'relative',
        }}
      >
        {isRepImageArray(images) && !images[currentIndex]?.url ? null : (
          <Image
            src={
              isRepImageArray(images)
                ? images[currentIndex]?.url
                : images[currentIndex]
            }
            alt="Exercise Image"
            width={width}
            height={0}
            layout="intrinsic"
          />
        )}

        <Typography
          textAlign="center"
          sx={{
            color: theme.palette.primary.main,
            position: 'absolute',
            bottom: 2,
            textShadow: `1px 1px 2px ${theme.palette.background.default}`,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {isRepImageArray(images) &&
          images[currentIndex]?.repNumber !== undefined
            ? `Rep ${images[currentIndex]?.repNumber}`
            : `${currentIndex + 1} / ${images.length}`}
        </Typography>
      </Box>
    </Box>
  );
}
