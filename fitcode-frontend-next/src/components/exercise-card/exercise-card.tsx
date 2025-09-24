// components/ExerciseCard.tsx
import { Box, Card, Typography } from '@mui/material';
import Image from 'next/image';
import React from 'react';

import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface ExerciseCardProps {
  exercise: Exercise;
  addExerciseForm?: boolean;
  prioritizeVideo?: boolean;
}

export function ExerciseCard(props: ExerciseCardProps) {
  const screenSize = useScreenSize();

  const { exercise, addExerciseForm } = props;
  const isVideo = false; // exercise.videoUrl !== undefined;
  const imgSrc = exercise.imageUrl || '/exercise-image-default.png';

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
          filter:
            exercise.videoUrl || exercise.imageUrl
              ? 'grayscale(100%)'
              : undefined,
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
