import { QrCode } from '@mui/icons-material';
import {
  Avatar,
  Box,
  IconButton,
  Tooltip as MuiTooltip,
  Typography,
} from '@mui/material';
import QRCode from 'qrcode';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { deselectAthlete } from './actions/actions-selected-athlete';
import useSelectedMemberWeight from './hooks/use-weight';
import { TrainingController } from '@/core/training/training.controller';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import MyModal from '@/ui/modal';

export default function SelectedMemberReport() {
  const screenSize = useScreenSize();
  const { users } = useMain();
  const { weight } = useSelectedMemberWeight();
  const trainerDayViewContext = useTrainerDayView();
  const { component, training, selectedAthlete } = trainerDayViewContext;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  if (!selectedAthlete) return null;

  async function generateQRCode(userId: string) {
    if (!training || !component) {
      return toast.error('Select training component');
    }

    try {
      const { link } = await TrainingController.getInstance().generateQRCode(
        training.id,
        component.id,
        userId
      );

      await navigator.clipboard.writeText(link);
      const qr = await QRCode.toDataURL(link);

      setQrDataUrl(qr);
      setQrOpen(true);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate QR code');
    }
  }

  const qrCodeSize = screenSize.isMobile ? 200 : 500;

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      position="relative"
      gap={1}
      my={screenSize.isMobile ? 1 : 0}
      flexDirection={screenSize.isMobile ? 'column' : 'row'}
    >
      <Box width={screenSize.isMobile ? '100%' : `${100 / 3}%`} display="flex">
        {training && component && (
          <IconButton onClick={() => generateQRCode(selectedAthlete.uid)}>
            <QrCode sx={{ fontSize: 30, mx: 'auto' }} />
          </IconButton>
        )}
      </Box>

      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={0.5}
      >
        <MuiTooltip title={selectedAthlete.email} sx={{ zIndex: 10 }}>
          <Box position="relative" display="inline-block">
            <Avatar
              className="avatar-border"
              src={
                users.find((m) => m.uid === selectedAthlete.uid)?.photoURL ||
                USER_AVATAR_IMG_URL
              }
              sx={{
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                filter: 'grayscale(100%)',
                zIndex: 10,
              }}
              onClick={() =>
                deselectAthlete({
                  ...trainerDayViewContext,
                  component,
                  training,
                })
              }
            />
          </Box>
        </MuiTooltip>

        <Typography fontSize={16} textAlign="center">
          Attendance: 79%
        </Typography>

        <Typography
          fontSize={16}
        >{`Weight: ${weight !== undefined ? weight.toString() + 'kg' : 'N/A'}`}</Typography>

        <Typography fontSize={16} textAlign="center">
          Height: 198 cm
        </Typography>
      </Box>

      <Box
        width={screenSize.isMobile ? '100%' : `${100 / 3}%`}
        textAlign="center"
      />

      <MyModal
        isOpen={qrOpen}
        onCancel={() => setQrOpen(false)}
        setIsOpen={(open) => setQrOpen(open)}
      >
        <Box p={2} display="flex" flexDirection="column" alignItems="center">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{ width: qrCodeSize, height: qrCodeSize }}
            />
          )}
        </Box>
      </MyModal>
    </Box>
  );
}
