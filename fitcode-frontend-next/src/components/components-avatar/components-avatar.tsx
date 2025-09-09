import { Avatar, Box } from '@mui/material';
import React from 'react';

import { getComponentIcon } from '@/common/service/util/icons.util';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

type Props = {
  size?: number; // Avatar px size
  components: TrainingComponent[]; // e.g. ['warmup','endurance','strength','cooldown']
  colors?: string[]; // optional per-icon color
  ringScale?: number; // 0..1, radius as fraction of avatar (default 0.75)
};

export default function ComponentsAvatarCircle({
  size = 50,
  components,
  colors = [],
  ringScale = 0.75,
}: Props) {
  const n = components.length;

  // Icon size heuristic: smaller as n grows, but not too tiny
  // Tweak the constants to your taste.
  const baseIconFrac = n <= 2 ? 0.58 : n <= 4 ? 0.5 : n <= 6 ? 0.42 : 0.36;
  const iconSize = Math.max(5, Math.min(size * baseIconFrac, size * 0.6)) * 0.6;

  // Circle radius — small margin so icons stay inside the Avatar even at an angle
  const radius = ((size - iconSize) / 2) * ringScale;

  // Helper to position each icon by angle
  const items =
    n === 0
      ? []
      : components.map((c, i) => {
          const Icon = getComponentIcon(c.component?.name || c.id || '');
          if (!Icon) return null;

          // Start from top (-90deg) and go clockwise
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const cx = size / 2 + radius * Math.cos(angle);
          const cy = size / 2 + radius * Math.sin(angle);

          return (
            <Box
              key={`${name}-${i}`}
              sx={{
                position: 'absolute',
                left: cx - iconSize / 2,
                top: cy - iconSize / 2,
                width: iconSize,
                height: iconSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none', // avoid intercepting clicks
              }}
            >
              <Icon
                sx={{
                  width: '100%',
                  height: '100%',
                  color: colors[i] ?? 'text.primary',
                }}
              />
            </Box>
          );
        });

  // Special case: one icon → center it big
  const single =
    n === 1
      ? (() => {
          const Icon = getComponentIcon(
            components[0]?.component?.name || components[0].id || ''
          );
          if (!Icon) return null;
          const singleSize = size * 0.7;
          return (
            <Box
              sx={{
                position: 'absolute',
                left: size / 2 - singleSize / 2,
                top: size / 2 - singleSize / 2,
                width: singleSize,
                height: singleSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <Icon
                sx={{
                  width: '100%',
                  height: '100%',
                  color: colors[0] ?? 'text.primary',
                }}
              />
            </Box>
          );
        })()
      : null;

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        position: 'relative',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {n === 1 ? single : items}
    </Avatar>
  );
}
