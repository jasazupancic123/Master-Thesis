import { TrainingController } from '@/core/training/training.controller';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { useState } from 'react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { useScreenSize } from '@/store/screen-size.provider';

export default function useQRCode() {
  const screenSize = useScreenSize();

  const { training, component } = useTrainerDayView();

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

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

  return {
    qrDataUrl,
    qrOpen,
    setQrOpen,
    generateQRCode,
    qrCodeSize,
  };
}
