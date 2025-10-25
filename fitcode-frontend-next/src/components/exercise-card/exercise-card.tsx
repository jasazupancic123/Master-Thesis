import { Box, Card, Typography } from '@mui/material';
import Image from 'next/image';
import React, { useEffect } from 'react';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { useScreenSize } from '@/store/screen-size.provider';
import { lib } from '@/lib';

interface Props {
  exercise: Exercise;
  addExerciseForm?: boolean;
}

export function ExerciseCard({ exercise, addExerciseForm }: Props) {
  const screenSize = useScreenSize();

  const isVideo = false;
  const imgSrc = exercise.imageUrl || EXERCISE_DEFAULT_IMG_URL;

  // Fixed media height similar to your previous maxHeight: 140
  const MEDIA_HEIGHT =
    screenSize.isMobile || screenSize.isTablet
      ? 100
      : addExerciseForm
        ? 120
        : 140;

  return (
    <Card sx={{ borderRadius: 5, overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: MEDIA_HEIGHT,
          bgcolor: 'background.dark',
          filter: 'grayscale(100%)',
        }}
      >
        {isVideo ? (
          <Box
            component="video"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            src={exercise.videoUrl!}
            muted
            loop
            autoPlay
            playsInline
            poster={imgSrc}
          />
        ) : (
          <Image
            src={imgSrc}
            alt={exercise.name}
            height={0}
            width={140}
            sizes="100vw"
            unoptimized={lib.common.env.unoptimizeImages()}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </Box>

      {/* Title */}
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ p: 0.5, overflow: 'hidden' }}
      >
        <Typography
          noWrap
          fontSize={16}
          fontWeight={600}
          textAlign="center"
          textTransform="uppercase"
          sx={{ flex: 1, minWidth: 0, px: 1 }}
          title={exercise.name}
        >
          {exercise.name}
        </Typography>
      </Box>
    </Card>
  );
}
