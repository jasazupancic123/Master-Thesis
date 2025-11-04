import { Box, Typography } from '@mui/material';

import { lib } from '@/lib';
import { INDEXED_DB_FIELDS } from '@/lib/common/const/indexed-db-fields.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import MyModal from '@/ui/modal';

export default function AiNoticeModal(props: ModalProps) {
  const { open, setOpen } = props;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      confirmText="Agree"
      cancelText="Cancel"
      onConfirm={async () => {
        lib.common.indexedDb.items.put({
          id: INDEXED_DB_FIELDS.aiNotice,
          payload: JSON.stringify({ acknowledged: true }),
          updatedAt: Date.now(),
        });
        setOpen(false);
      }}
      onCancel={() => {
        setOpen(false);
      }}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <Typography fontWeight="bold" textAlign="center">
          ⚠️ AI Tracking Privacy Notice
        </Typography>
        <Typography textAlign="center">
          By activating the camera, you agree that video and movement data will
          be temporarily recorded and processed using computer vision for
          performance analysis. Captured frames may be stored securely to
          enhance feedback accuracy and training insights. We respect your
          privacy — data is handled in accordance with our Privacy Policy and
          used only for training analysis purposes.
        </Typography>
      </Box>
    </MyModal>
  );
}
