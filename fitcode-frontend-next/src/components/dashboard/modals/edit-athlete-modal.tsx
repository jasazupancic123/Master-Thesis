import { Box } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { useDashboardUserActions } from '../context/user-actions.context';
import { theme } from '@/app/style';
import { FaceEncoderController } from '@/core/face-encoder/face-encoder.controller';
import { Gender } from '@/core/user/enum/gender.enum';
import { SportLevel } from '@/core/user/enum/sport-level.enum';
import { UserController } from '@/core/user/user.controller';
import { lib } from '@/lib';
import { InputType } from '@/lib/common/const/input-type.const';
import { SPORTS } from '@/lib/common/const/sport.const';
import type { FormItem } from '@/lib/common/type/form-item.type';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import FileUpload from '@/ui/file-upload';
import FormItemDropdownMenu from '@/ui/form-item-dropdown-menu';
import FormItemsContainer from '@/ui/form-items-container';
import LoadingOverlay from '@/ui/loading-overlay';
import MyModal from '@/ui/modal';

export const DASHBOARD_MEMBERS_AVATAR_SIZE = 50;

export default function EditAthleteModal({ open, setOpen }: ModalProps) {
  const router = useRouter();
  const { user } = useAuthenticatedAuth();

  const {
    activeUser: userToEdit,
    toggleUser,
    onUserChange,
    updateUser,
  } = useDashboardUserActions();

  const [base64Preview, setBase64Preview] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [openGenderMenu, setOpenGenderMenu] = useState(false);
  const [openSportMenu, setOpenSportMenu] = useState(false);
  const [openSportLevelMenu, setOpenSportLevelMenu] = useState(false);

  if (!userToEdit) return;

  const formItems: FormItem[] = [
    {
      label: 'Full Name',
      value: userToEdit.displayName,
      optional: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        onUserChange('displayName', e.target.value);
      },
    },
    {
      label: 'Email',
      value: userToEdit.email,
      disabled: true,
      optional: true,
      onChange: (_e: React.ChangeEvent<HTMLInputElement>) => {},
    },
    {
      label: 'Gender',
      value: userToEdit.gender,
      optional: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (
          !e.target.value ||
          !Object.values(Gender).includes(e.target.value as Gender)
        )
          return;

        onUserChange('gender', e.target.value as Gender);
      },
      customElement: () => {
        return (
          <FormItemDropdownMenu<Gender>
            value={userToEdit.gender}
            values={Object.values(Gender)}
            onItemSelect={(item: Gender) => {
              onUserChange('gender', item);
            }}
            open={openGenderMenu}
            setOpen={setOpenGenderMenu}
          />
        );
      },
    },
    {
      label: 'Date of Birth',
      value: userToEdit.birthDate,
      optional: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
          const date = new Date(e.target.value);
          if (isNaN(date.getTime())) onUserChange('birthDate', undefined);
          else onUserChange('birthDate', date);
        } catch (_e) {}
      },
      customElement: () => {
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={userToEdit.birthDate ? dayjs(userToEdit.birthDate) : null}
              onChange={(newValue) => {
                try {
                  if (newValue) onUserChange('birthDate', newValue.toDate());
                  else onUserChange('birthDate', undefined);
                } catch (_e) {}
              }}
              sx={{
                height: 40,
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: {
                    borderRadius: 10,
                    '& .MuiPickersOutlinedInput-notchedOutline': {
                      borderRadius: 10,
                      color: theme.palette.text.secondary,
                    },
                  },
                },
                openPickerIcon: {
                  fontSize: 'small',
                },
              }}
            />
          </LocalizationProvider>
        );
      },
    },
    {
      label: 'Sport',
      value: userToEdit.sport || '',
      optional: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        onUserChange('sport', e.target.value);
      },
      customElement: () => {
        return (
          <FormItemDropdownMenu<string>
            value={userToEdit.sport}
            values={SPORTS}
            onItemSelect={(item: string) => {
              onUserChange('sport', item);
            }}
            open={openSportMenu}
            setOpen={setOpenSportMenu}
          />
        );
      },
    },
    {
      label: 'Sport Lavel',
      value: userToEdit.level || '',
      optional: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (
          !e.target.value ||
          !Object.values(SportLevel).includes(e.target.value as SportLevel)
        )
          return;

        onUserChange('level', e.target.value as SportLevel);
      },
      customElement: () => {
        return (
          <FormItemDropdownMenu<SportLevel>
            value={userToEdit.level}
            values={Object.values(SportLevel)}
            onItemSelect={(item: SportLevel) => {
              onUserChange('level', item);
            }}
            open={openSportLevelMenu}
            setOpen={setOpenSportLevelMenu}
          />
        );
      },
    },
  ];

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
            label={'Image'}
            input={InputType.IMAGE}
            initialFileUrl={base64Preview || userToEdit?.photoURL || undefined}
            disableBorder
            iconDisplay
            enableCameraCapture
            onRemoveFile={
              userToEdit.photoURL || base64Preview
                ? () => {
                    onUserChange('photoURL', null);
                    setBase64Preview('');
                    setFile(null);
                  }
                : undefined
            }
            onFileUpload={async (file) => {
              const base64 = await lib.firebase.storage.fileToBase64(file);

              setFile(file);
              setBase64Preview(base64);
            }}
            containerSx={{
              width: 'fit-content',
              margin: '0 auto',
            }}
          />
        </Box>
        <FormItemsContainer formItems={formItems} />
      </Box>

      {isUpdatingProfile && <LoadingOverlay title="Updating Profile..." />}
    </MyModal>
  );
}
