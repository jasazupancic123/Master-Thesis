import type { SxProps } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Accept } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';

interface Props extends Partial<React.PropsWithChildren> {
  label: string;
  onFileUpload: (file: File) => Promise<void>;
  input: 'image' | 'video' | 'csv';
  initialFileUrl?: string;
  sx?: SxProps;
  makeRound?: boolean;
  disableBorder?: boolean;
  width?: number;
  height?: number;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10 MB

export default function FileUpload(props: Props) {
  const { label, onFileUpload, input, initialFileUrl, sx, children } = props;
  const [preview, setPreview] = useState(() => ({
    url: initialFileUrl || '',
    error: '',
  }));

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (input === 'csv')
      // For CSV files, no preview is needed
      setPreview((prev) => ({ ...prev, url: '', error: '' }));
    else {
      const url = URL.createObjectURL(file);
      setPreview((prev) => ({ ...prev, url }));
    }
  }, []);

  const maxSize =
    input === 'image'
      ? MAX_IMAGE_SIZE
      : input === 'video'
        ? MAX_VIDEO_SIZE
        : MAX_CSV_SIZE;

  const accept: Accept = {
    ...(input === 'image' && { 'image/*': ['.png', '.jpeg'] }),
    ...(input === 'video' && { 'video/*': ['.mp4'] }),
    ...(input === 'csv' && { 'text/csv': ['.csv'] }),
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles: 1,
    });

  useEffect(() => {
    if (initialFileUrl) {
      setPreview((prev) => ({ ...prev, url: initialFileUrl }));
    }
  }, [initialFileUrl]);

  /**
   * Clean up the previewUrl when the component unmounts
   */
  useEffect(() => {
    if (preview.error)
      // reset the previewUrl if there is an error
      setPreview({ url: '', error: preview.error });

    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, []);

  /**
   * Upload file to the server
   */
  useEffect(() => {
    const file = acceptedFiles[0];
    if (!file) return;

    onFileUpload(file).catch((e) => {
      setPreview((prev) => ({
        ...prev,
        error: e.message || 'An error occurred',
      }));
    });
  }, [acceptedFiles]);

  return (
    <div {...getRootProps()} style={{ width: '100%', height: 150 }}>
      <input {...getInputProps()} />

      <DragAndDropPlaceholder
        onClick={() => {
          // set error to empty string to remove the error message
          setPreview((prev) => ({ ...prev, error: '' }));
        }}
        sx={{
          ...sx,
          width: '100%',
          height: !preview.error && preview.url ? undefined : '100%',
        }}
        dissableBorder={props.disableBorder}
      >
        <Box
          width="100%"
          sx={{
            height: !preview.error && preview.url ? undefined : '100%',
            mx: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {preview.error ? (
            <Typography color="error">{preview.error}</Typography>
          ) : preview.url ? null : isDragActive ? (
            <Typography width="100%">Drop</Typography>
          ) : (
            <Typography width="100%" textAlign="center" my={'auto'} px={1}>
              {`Drop ${label} here or click to select`}
            </Typography>
          )}
        </Box>

        {!preview.error && preview.url && input !== 'csv' && (
          <Box
            height={150}
            position="relative"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            {children ? (
              children
            ) : input === 'video' ? (
              <video
                src={preview.url}
                muted
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                onError={() => {
                  setPreview((prev) => ({ ...prev, error: 'Invalid video' }));
                }}
              />
            ) : (
              <Image
                src={preview.url}
                alt="Image Preview"
                width={props.width || 140}
                height={props.height || 140}
                style={{
                  objectFit: 'cover',
                  borderRadius: props.makeRound ? '50%' : undefined,
                  overflow: 'hidden', // ensures overflow is hidden
                  display: 'block',
                }}
                onError={(_e) => {
                  setPreview((prev) => ({ ...prev, error: 'Invalid image' }));
                }}
              />
            )}
          </Box>
        )}

        {input === 'csv' && acceptedFiles.length > 0 && (
          <Box height={100} position="relative" p={1}>
            <Typography>CSV File: {acceptedFiles[0].name}</Typography>
          </Box>
        )}
      </DragAndDropPlaceholder>
    </div>
  );
}

function DragAndDropPlaceholder(props: {
  children: ReactNode;
  onClick: () => void;
  sx?: SxProps;
  dissableBorder?: boolean;
}) {
  return (
    <Box
      height="100%"
      width="100%"
      onClick={props.onClick}
      sx={{
        ...props.sx,
        border: props.dissableBorder ? 'none' : '1px dashed grey',
        cursor: 'pointer',
      }}
    >
      {props.children}
    </Box>
  );
}
