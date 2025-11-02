import QRCode from 'qrcode';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser } from '@/core/auth/type/user.type';

export type QRCodeContextMenu = {
  mouseX: number;
  mouseY: number;
  member: AuthUser | null;
};

export function useQRCode() {
  const [qrOpen, setQrOpen] = useState(false);
  const [qrAnchorEl, setQrAnchorEl] = useState<HTMLElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<QRCodeContextMenu | null>(
    null
  );

  function toggleContextMenu(
    e: React.MouseEvent<HTMLDivElement>,
    member: AuthUser
  ) {
    e.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: e.clientX + 2, mouseY: e.clientY - 6, member }
        : null
    );
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  async function generateQRCode(member: AuthUser, anchorEl: HTMLElement) {
    try {
      const { link } = await AuthController.getInstance().createLink(
        member.uid
      );

      const qr = await QRCode.toDataURL(link);
      setQrDataUrl(qr);
      setQrAnchorEl(anchorEl);
      setQrOpen(true);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate QR code');
    } finally {
      closeContextMenu();
    }
  }

  return {
    qrOpen,
    setQrOpen,
    qrAnchorEl,
    qrDataUrl,
    contextMenu,
    toggleContextMenu,
    closeContextMenu,
    generateQRCode,
  };
}
