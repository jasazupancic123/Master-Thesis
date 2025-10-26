import { lib } from '@/lib';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps extends React.PropsWithChildren {
  /** Current image URL (remote or initial) */
  value?: string;
  /** Callback when user selects a new image */
  onChange: (file: File) => Promise<void>;
  /** Width and height of the preview */
  size?: number;
  /** Make the image round (circle) */
  round?: boolean;
  /** Disable the dashed border */
  disableBorder?: boolean;
  /** Text to display in the placeholder */
  placeholder?: string;
  /** Max image size in bytes (default 20 MB) */
  maxSize?: number;
}

const DEFAULT_SIZE = 140;
const DEFAULT_MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export default function ImageUpload({
  value,
  onChange,
  size = DEFAULT_SIZE,
  round = false,
  disableBorder = false,
  placeholder = 'Drop image here or click to select',
  maxSize = DEFAULT_MAX_SIZE,
  children,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<{ url: string; error: string }>({
    url: value || '',
    error: '',
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setPreview({ url, error: '' });

      onChange(file).catch((err) => {
        setPreview({ url: '', error: err.message || 'Upload failed' });
      });
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize,
  });

  useEffect(() => {
    if (value) setPreview({ url: value, error: '' });
  }, [value]);

  useEffect(() => {
    return () => {
      if (preview.url.startsWith('blob:')) URL.revokeObjectURL(preview.url);
    };
  }, [preview.url]);

  const showPlaceholder = !preview.url || (!value && !preview.url);

  return (
    <Box
      {...getRootProps()}
      width={size}
      height={size}
      sx={{
        border: disableBorder ? 'none' : '1px dashed grey',
        borderRadius: round ? '50%' : 2,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <input {...getInputProps()} />
      <Box
        width={size}
        height={size}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {preview.error && preview.url ? (
          <Typography color="error" textAlign="center">
            {preview.error}
          </Typography>
        ) : !showPlaceholder ? (
          children ? (
            <>{children}</>
          ) : (
            <Image
              src={preview.url}
              alt="Preview"
              width={size}
              height={size}
              unoptimized={lib.common.env.unoptimizeImages()}
              style={{
                objectFit: 'cover',
                borderRadius: round ? '50%' : undefined,
                display: 'block',
              }}
              onError={() =>
                setPreview({ url: '', error: 'Invalid image format' })
              }
            />
          )
        ) : (
          <Typography textAlign="center">
            {isDragActive ? 'Drop image...' : placeholder}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
