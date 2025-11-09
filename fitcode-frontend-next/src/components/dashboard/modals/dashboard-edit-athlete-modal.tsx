import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { useDashboardUserEdit } from '../context/user-edit.context';
import { Gender } from '@/core/profile/enum/gender.enum';
import { SportLevel } from '@/core/profile/enum/sport-level.enum';
import { lib } from '@/lib';
import { SPORTS } from '@/lib/common/const/sport.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';

const DEFAULT_MARGIN = 1;

export default function DashboardEditAthleteModal({
  open,
  setOpen,
}: ModalProps) {
  const screenSize = useScreenSize();
  const { user } = useAuthenticatedAuth();

  const {
    userToEdit,
    profileToEdit,
    updateUserProfile,
    toggleUser,
    onProfileChange,
    onUserChange,
  } = useDashboardUserEdit();

  if (!userToEdit) return;

  return (
    <MyModal
      isOpen={open && userToEdit?.uid !== user.uid}
      setIsOpen={setOpen}
      cancelText="Close"
      onConfirm={updateUserProfile}
      onCancel={() => {
        setOpen(false);
        toggleUser(null);
      }}
    >
      <Box display="flex" flexDirection="column" gap={2}>
        <FileUpload
          input="image"
          label="Image"
          makeRound
          initialFileUrl={userToEdit?.photoURL || undefined}
          disableBorder={
            userToEdit?.photoURL !== undefined && userToEdit?.photoURL !== null
          }
          sx={{
            maxWidth: screenSize.isMobile ? 200 : 400,
            maxHeight: screenSize.isMobile ? 150 : 300,
            margin: 'auto',
          }}
          onFileUpload={async (file) => {
            const path = `user/${userToEdit.uid}/${file.name}`;
            const url = await lib.firebase.storage.uploadFile(file, path);
            onUserChange('photoURL', url);
          }}
        />

        {/* First & Last Name - Ensuring Equal Width */}
        <Box
          display="flex"
          width="100%"
          my={DEFAULT_MARGIN}
          gap={DEFAULT_MARGIN}
        >
          <TextField
            label={!userToEdit?.displayName ? 'Display Name' : undefined}
            variant="outlined"
            sx={{ flex: 1 }}
            value={userToEdit?.displayName || ''}
            onChange={(e) => onUserChange('displayName', e.target.value)}
          />
        </Box>

        <Box display="flex" width="100%" my={DEFAULT_MARGIN}>
          {/* Gender Dropdown */}
          <FormControl sx={{ flex: 1, mr: DEFAULT_MARGIN }}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={profileToEdit?.gender ?? ''} // Use nullish coalescing (??) to allow empty value
              label="Gender"
              onChange={(e) =>
                onProfileChange('gender', e.target.value as Gender)
              }
            >
              <MenuItem value="" disabled>
                Select Gender
              </MenuItem>

              {Object.values(Gender).map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() +
                    gender.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date of Birth (Ensuring Full Width) */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth"
              value={
                profileToEdit?.birthDate
                  ? dayjs(profileToEdit?.birthDate)
                  : null
              }
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
              sx={{ flex: 1 }}
              onChange={(newValue) =>
                onProfileChange('birthDate', newValue?.toDate())
              }
            />
          </LocalizationProvider>
        </Box>

        <Box
          display="flex"
          width="100%"
          gap={DEFAULT_MARGIN}
          my={DEFAULT_MARGIN}
        >
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Sport</InputLabel>
            <Select
              value={profileToEdit?.sport || ''}
              label="Sport"
              onChange={(e) => onProfileChange('sport', e.target.value)}
            >
              {SPORTS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Sport Level</InputLabel>
            <Select
              value={profileToEdit?.level ?? ''}
              label="Sport Level"
              onChange={(e) =>
                onProfileChange('level', e.target.value as SportLevel)
              }
            >
              <MenuItem value="" disabled>
                Select Sport Level
              </MenuItem>

              {Object.values(SportLevel).map((sl) => (
                <MenuItem key={sl} value={sl}>
                  {sl.charAt(0).toUpperCase() + sl.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </MyModal>
  );
}
