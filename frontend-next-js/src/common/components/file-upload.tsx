import { Accept, useDropzone } from 'react-dropzone';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface Props {
  label: string;
  onFileUpload: (file: File) => Promise<void>;
  input: 'image' | 'video';
  initialFileUrl?: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function FileUpload(props: Props) {
  const { label, onFileUpload, input, initialFileUrl } = props;
  const [preview, setPreview] = useState(() => ({
    url: initialFileUrl || '',
    error: '',
  }));

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const url = URL.createObjectURL(acceptedFiles[0]);
    setPreview(prev => ({ ...prev, url }));
  }, []);

  const maxSize = input === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  const accept: Accept = {
    ...(input === 'image' && { 'image/*': ['.png', '.jpeg'] }),
    ...(input === 'video' && { 'video/*': ['.mp4'] }),
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
  });

  /**
   * Clean up the previewUrl when the component unmounts
   */
  useEffect(() => {
    if (preview.error) // reset the previewUrl if there is an error
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
    if (!file)
      return;

    const uploadFile = async () => {
      try {
        await onFileUpload(file);
      } catch (e: any) {
        setPreview(prev => ({ ...prev, error: e.message || 'An error occurred' }));
      }
    };

    uploadFile().then();
  }, [acceptedFiles]);

  return (
    <div {...getRootProps()} style={{ width: '100%', height: 150 }}>
      <input {...getInputProps()} />

      <DragAndDropPlaceholder
        onClick={() => {
          // set error to empty string to remove the error message
          setPreview(prev => ({ ...prev, error: '' }));
        }}
      >
        <Box p={1}>
          <Typography>{label}</Typography>

          {preview.error
            ? <Typography color="error">{preview.error}</Typography>
            : preview.url
              ? null
              : isDragActive
                ? <Typography width="100%">Drop</Typography>
                : <Typography width="100%">Drop file here or click to select</Typography>
          }
        </Box>

        {!preview.error && preview.url && (
          <Box height={100} position="relative">
            {input === 'video' ? (
              <video
                src={preview.url}
                controls
                muted
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                onError={() => {
                  setPreview(prev => ({ ...prev, error: 'Invalid video' }));
                }}
              />
            ) : (
              <img
                src={preview.url}
                alt="Image Preview"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                onError={() => {
                  setPreview(prev => ({ ...prev, error: 'Invalid image' }));
                }}
              />

              /*<Image
                src={previewUrl}
                alt="Image Preview"
                style={{ objectFit: 'cover' }}
                fill
                onError={() => setPreviewUrl(null)}
              />*/
            )}
          </Box>
        )}
      </DragAndDropPlaceholder>
    </div>
  );
}

function DragAndDropPlaceholder(props: { children: ReactNode, onClick: () => void }) {
  return (
    <Box
      height="100%"
      width="100%"
      onClick={props.onClick}
      sx={{
        border: '1px dashed grey',
        cursor: 'pointer',
      }}>
      {props.children}
    </Box>
  );
}