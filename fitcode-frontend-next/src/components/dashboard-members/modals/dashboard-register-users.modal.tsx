'use client';

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import useInstitutionMembers from '../../dashboard/hooks/use-institution-members.hook';
import useRegisterMemberForm from '../../dashboard/hooks/use-register-member-form.hook';
import type { UserRole } from '@/core/user/enum/user-role.enum';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import MyModal from '@/ui/modal';
import FileUpload from '@/ui/file-upload';
import { InputType } from '@/lib/common/const/input-type.const';
import { useState } from 'react';
import { CameraCapture } from '@/ui/camera-capture';
import { CameraAlt } from '@mui/icons-material';
import { theme } from '@/app/style';
import toast from 'react-hot-toast';

interface Props {
  registerRole: UserRole;
}

export default function RegisterUsersDashboardModal(props: ModalProps & Props) {
  const {
    openUserAlreadyExistsModal,
    setOpenUserAlreadyExistsModal,
    existingUser,
    setExistingUser,
    isUploadingMembers,
    registerUser,
    addUser,
  } = useInstitutionMembers();

  const { formData, setFormField, clearFormData } = useRegisterMemberForm();

  const { open, setOpen, registerRole } = props;

  const [file, setFile] = useState<File | undefined>(undefined);
  const [tempPhotoURL, setTempPhotoURL] = useState<string | undefined>(
    undefined
  );

  return (
    <>
      <MyModal
        isOpen={open}
        setIsOpen={(open) => setOpen(open)}
        onConfirm={() => {
          setFile(undefined);
          setTempPhotoURL(undefined);
        }}
        onCancel={() => {
          setFile(undefined);
          setTempPhotoURL(undefined);
          clearFormData();
          setOpen(false);
        }}
        cancelText="Close"
        sx={{
          minWidth:
            typeof window !== 'undefined'
              ? Math.min(window.innerWidth * 0.8, 400)
              : 400,
        }}
        dialogueContentSx={{
          minWidth:
            typeof window !== 'undefined'
              ? Math.min(window.innerWidth * 0.8, 400)
              : 400,
        }}
      >
        <Box
          width={
            typeof window !== 'undefined'
              ? Math.min(window.innerWidth * 0.8, 300)
              : 300
          }
          display="flex"
          flexDirection="column"
          justifyContent="center"
          mx="auto"
          gap={2}
        >
          <Typography
            variant="h5"
            gutterBottom
            mb={2}
            textAlign="center"
            width="100%"
          >
            Register New {registerRole[0].toUpperCase() + registerRole.slice(1)}
          </Typography>

          <FileUpload
            label={'Image'}
            input={InputType.IMAGE}
            initialFileUrl={tempPhotoURL}
            disableBorder
            iconDisplay
            enableCameraCapture
            onFileUpload={async (file: File) => {
              if (file) {
                setFile(file);
                const url = URL.createObjectURL(file);
                setTempPhotoURL(url);
              }
            }}
          />

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const success = await registerUser(registerRole, formData, file);

              if (success) {
                clearFormData();
                setFile(undefined);
                setTempPhotoURL(undefined);
                setOpen(false);
              }
            }}
          >
            <Stack spacing={2}>
              <TextField
                label="Display Name"
                name="displayName"
                value={formData.displayName}
                onChange={(e) => setFormField('displayName', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormField('email', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormField('password', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormField('confirmPassword', e.target.value)
                }
                fullWidth
                required
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Register
              </Button>
            </Stack>
          </form>
        </Box>
      </MyModal>

      <MyModal
        isOpen={openUserAlreadyExistsModal}
        setIsOpen={(open) => setOpenUserAlreadyExistsModal(open)}
        onConfirm={() => addUser(existingUser)}
        onCancel={() => {
          setOpenUserAlreadyExistsModal(false);
          setExistingUser(null);
        }}
      >
        User with email &quot;{existingUser?.email}&quot; already exists. Do you
        want to add them to the institution?
      </MyModal>

      {isUploadingMembers && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
          sx={{ zIndex: 130000, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <CircularProgress size={24} />
          <Typography fontSize={20}>Registering ...</Typography>
        </Box>
      )}
    </>
  );
}
