import { Box, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { theme } from '@/app/style';
import { RepImage } from '@/controller/training/type/training-exercise.type';

interface ImageGalleryProps {
  images: string[] | RepImage[];
}

export default function ImageGallery(props: ImageGalleryProps) {
  const { images } = props;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const width = Math.min(600, window.innerWidth * 0.75);

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
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          position: 'relative',
        }}
      >
        {currentIndex > 0 && (
          <IconButton
            onClick={() =>
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
            }
            sx={{
              position: 'absolute',
              left: 2,
              zIndex: 100,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.palette.text.primary,
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}

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

        {currentIndex < images.length - 1 && (
          <IconButton
            onClick={() =>
              setCurrentIndex((prev) =>
                prev < images.length - 1 ? prev + 1 : prev
              )
            }
            sx={{
              position: 'absolute',
              right: 2,
              zIndex: 100,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.palette.text.primary,
            }}
          >
            <ChevronRight />
          </IconButton>
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
