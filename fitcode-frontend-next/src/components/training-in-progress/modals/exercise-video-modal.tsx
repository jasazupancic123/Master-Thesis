import { Box } from '@mui/material';

import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useScreenSize } from '@/store/screen-size.provider';
import MyModal from '@/ui/modal';

interface Props {
  videoUrl: string;
}

export default function ExerciseVideoModal(props: ModalProps & Props) {
  const screenSize = useScreenSize();

  const { open, setOpen, videoUrl } = props;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      cancelText="Close"
      onCancel={() => {
        setOpen(false);
      }}
    >
      <Box
        component="video"
        src={videoUrl}
        controls
        autoPlay
        muted
        loop
        sx={{
          width: '100%', // Make it responsive
          maxWidth: screenSize.isLandscapeMobile ? 400 : 600, // Limit max width
        }}
      />
    </MyModal>
  );
}
