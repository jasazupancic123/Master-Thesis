import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import ImagePickerSlider from './image-picker-slider';
import { theme } from '@/app/style';
import type { RepImage } from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';

interface ImageGalleryProps {
  imagesL: string[] | RepImage[];
  imagesR: string[] | RepImage[];
  enableImagePickerSlider?: boolean;
}

export default function ImageGallery(props: ImageGalleryProps) {
  const { imagesL, imagesR, enableImagePickerSlider = false } = props;

  const [currentIndex, setCurrentIndex] = useState(0);

  const width = Math.min(600, window.innerWidth);

  // check if it's array of strings or array of objects
  function isRepImageArray(
    images: (string | RepImage)[]
  ): images is RepImage[] {
    return (
      Array.isArray(images) &&
      images.length > 0 &&
      typeof images[0] === 'object' &&
      'repNumber' in images[0] &&
      'url' in images[0]
    );
  }

  function isRepImage(image: string | RepImage): image is RepImage {
    return typeof image === 'object' && 'repNumber' in image && 'url' in image;
  }

  if ((!imagesL || imagesL.length === 0) && (!imagesR || imagesR.length === 0))
    return null;

  const maxIndex = Math.max(imagesL.length, imagesR.length) - 1;

  const images = [] as (string | RepImage)[];

  for (let i = 0; i <= maxIndex; i++) {
    const imgL = imagesL[i];
    const imgR = imagesR[i];

    if (imgL) images.push(isRepImage(imgL) ? { ...imgL, side: 'L' } : imgL);
    if (imgR) images.push(isRepImage(imgR) ? { ...imgR, side: 'R' } : imgR);
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
    >
      {enableImagePickerSlider && (
        <ImagePickerSlider
          images={
            isRepImageArray(images)
              ? images.map((img) => img.url)
              : (images as string[])
          }
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
        {!images[currentIndex] !== null && (
          <Image
            src={
              isRepImage(images[currentIndex])
                ? images[currentIndex].url
                : (images[currentIndex] as string)
            }
            unoptimized={lib.common.env.unoptimizeImages()}
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
            ? imagesL && imagesR && imagesL.length && imagesR.length
              ? `Rep ${images[currentIndex]?.repNumber} - ${images[currentIndex]?.side || ''}`
              : `Rep ${images[currentIndex]?.repNumber}`
            : `${currentIndex + 1} / ${images.length}`}
        </Typography>
      </Box>
    </Box>
  );
}
