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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { useDashboardUserEdit } from '../context/user-edit.context';
import { FaceEncoderController } from '@/core/face-encoder/face-encoder.controller';
import { Gender } from '@/core/user/enum/gender.enum';
import { SportLevel } from '@/core/user/enum/sport-level.enum';
import { UserController } from '@/core/user/user.controller';
import { lib } from '@/lib';
import { InputType } from '@/lib/common/const/input-type.const';
import { SPORTS } from '@/lib/common/const/sport.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';
import LoadingOverlay from '@/ui/loading-overlay';
import MyModal from '@/ui/modal';

const DEFAULT_MARGIN = 1;

export const DASHBOARD_MEMBERS_AVATAR_SIZE = 50;

export default function EditAthleteModal({ open, setOpen }: ModalProps) {
  const router = useRouter();
  const screenSize = useScreenSize();
  const { user } = useAuthenticatedAuth();

  const { userToEdit, setUserToEdit, toggleUser, onUserChange, updateUser } =
    useDashboardUserEdit();

  const [base64Preview, setBase64Preview] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  if (!userToEdit) return;

  return (
    <MyModal
      isOpen={open && userToEdit?.uid !== user.uid}
      setIsOpen={setOpen}
      cancelText="Close"
      onConfirm={async () => {
        setIsUpdatingProfile(true);

        let url: string | null = userToEdit.photoURL;
        let base64: string | undefined = userToEdit?.photoURLBase64;

        let postedBase64: string | undefined = undefined;

        if (file) {
          const path = `user/${userToEdit.uid}/${file.name}`;
          const { url: uploadedUrl, base64: uploadedBase64 } =
            await lib.firebase.storage.uploadFileWithBase64(file, path, {
              maxDimensionCrop: 300,
            });

          url = uploadedUrl;
          base64 = uploadedBase64;
          postedBase64 = uploadedBase64;
          onUserChange('photoURL', url);
        }

        const photoUrl = url || userToEdit.photoURL;

        // Update user profile
        await updateUser({
          force: url !== null || base64 !== undefined ? true : false,
          passedUser: {
            ...userToEdit,
            photoURLBase64: base64,
            photoURL:
              typeof photoUrl === 'string' && photoUrl.length > 0
                ? photoUrl
                : null,
          },
        });

        // Upload face embeddings
        if (postedBase64) {
          try {
            const res = await new FaceEncoderController().embed(postedBase64);
            if (!res.faceEmbedding || res.faceEmbedding.length === 0) {
              toast.error('Empty face embeddings received');
              return;
            }

            handleApiRequest(
              router,
              () =>
                UserController.getInstance().saveFaceEmbeddings(
                  userToEdit.uid,
                  res.faceEmbedding
                ),
              () => {
                toast.success('Face embeddings saved successfully');
              },
              undefined,
              'Failed to save face embeddings.'
            );
          } catch (error) {
            toast.error('Failed to generate face embeddings.');
            console.log('Face Embedding Error:', error);
          }
        }

        setOpen(false);
        setBase64Preview('');
        setFile(null);
        toggleUser(null);
        setIsUpdatingProfile(false);
      }}
      onCancel={() => {
        setOpen(false);
        toggleUser(null);
        setBase64Preview('');
        setFile(null);
        setIsUpdatingProfile(false);
      }}
    >
      <Box display="flex" flexDirection="column" gap={2}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            position: 'relative',
          }}
        >
          <FileUpload
            input={InputType.IMAGE}
            label="Image"
            makeRound
            initialFileUrl={base64Preview || userToEdit?.photoURL || undefined}
            disableBorder={
              userToEdit?.photoURL !== undefined &&
              userToEdit?.photoURL !== null &&
              userToEdit?.photoURL !== ''
            }
            onRemoveFile={
              userToEdit.photoURL || base64Preview
                ? () => {
                    setUserToEdit({ ...userToEdit, photoURL: null });
                    setBase64Preview('');
                    setFile(null);
                  }
                : undefined
            }
            sx={{
              maxWidth: screenSize.isMobile ? 200 : 400,
              maxHeight: screenSize.isMobile ? 150 : 300,
              margin: 'auto',
            }}
            onFileUpload={async (file) => {
              const base64 = await lib.firebase.storage.fileToBase64(file);

              setFile(file);
              setBase64Preview(base64);
            }}
          />
        </Box>

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
              value={userToEdit?.gender ?? ''} // Use nullish coalescing (??) to allow empty value
              label="Gender"
              onChange={(e) => onUserChange('gender', e.target.value as Gender)}
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
                userToEdit?.birthDate ? dayjs(userToEdit?.birthDate) : null
              }
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
              sx={{ flex: 1 }}
              onChange={(newValue) =>
                onUserChange('birthDate', newValue?.toDate())
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
              value={userToEdit?.sport || ''}
              label="Sport"
              onChange={(e) => onUserChange('sport', e.target.value)}
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
              value={userToEdit?.level ?? ''}
              label="Sport Level"
              onChange={(e) =>
                onUserChange('level', e.target.value as SportLevel)
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

      {isUpdatingProfile && <LoadingOverlay title="Updating Profile..." />}
    </MyModal>
  );
}
