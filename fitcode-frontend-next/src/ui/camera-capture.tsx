import { CameraAlt } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useRef } from 'react';

import { theme } from '@/app/style';

type Props = {
  onCapture: (file: File) => void;
  facingMode?: 'user' | 'environment';
};

export function CameraCapture({
  onCapture,
  facingMode = 'environment',
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pickingRef = useRef(false);

  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <IconButton
        type="button"
        sx={{ p: 0.5, m: 0, backgroundColor: theme.palette.primary.main }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (pickingRef.current) return;
          pickingRef.current = true;

          inputRef.current?.click();
        }}
      >
        <CameraAlt
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': { color: theme.palette.text.primary },
          }}
        />
      </IconButton>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={facingMode}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];

          e.currentTarget.value = '';
          pickingRef.current = false;

          if (!file) return;
          onCapture(file);
        }}
      />
    </Box>
  );
}
