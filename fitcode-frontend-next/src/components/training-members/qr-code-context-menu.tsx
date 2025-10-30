import { Box, Menu, MenuItem, Popover, Typography } from '@mui/material';

import { type QRCodeContextMenu } from './hooks/use-qr-code.hook';
import type { AuthUser } from '@/core/auth/type/user.type';

interface Props {
  contextMenu: QRCodeContextMenu | null;
  closeContextMenu: () => void;
  generateQRCode: (member: AuthUser, anchorEl: HTMLElement) => Promise<void>;
  qrOpen: boolean;
  setQrOpen: (open: boolean) => void;
  qrAnchorEl: HTMLElement | null;
  qrDataUrl: string | null;
}

export default function QrCodeContextMenu({
  contextMenu,
  closeContextMenu,
  generateQRCode,
  qrOpen,
  setQrOpen,
  qrAnchorEl,
  qrDataUrl,
}: Props) {
  return (
    <>
      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={(e) =>
            contextMenu?.member &&
            generateQRCode(contextMenu.member, e.currentTarget)
          }
        >
          Generate QR Login Link
        </MenuItem>
      </Menu>

      <Popover
        open={qrOpen}
        anchorEl={qrAnchorEl}
        onClose={() => setQrOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { zIndex: 2000, boxShadow: 6, borderRadius: 2 } }}
      >
        <Box p={2} display="flex" flexDirection="column" alignItems="center">
          <Typography variant="subtitle2" mb={1}>
            Scan to Login
          </Typography>

          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{ width: 200, height: 200 }}
            />
          )}
        </Box>
      </Popover>
    </>
  );
}
