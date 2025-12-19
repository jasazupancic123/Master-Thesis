'use client';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useState } from 'react';

import useInstitutionMembers from '../../dashboard/hooks/use-institution-members.hook';
import useRegisterMemberForm from '../../dashboard/hooks/use-register-member-form.hook';
import { theme } from '@/app/style';
import { Gender } from '@/core/user/enum/gender.enum';
import type { UserRole } from '@/core/user/enum/user-role.enum';
import { InputType } from '@/lib/common/const/input-type.const';
import type { FormItem } from '@/lib/common/type/form-item.type';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import FileUpload from '@/ui/file-upload';
import FormItemDropdownMenu from '@/ui/form-item-dropdown-menu';
import FormItemsContainer from '@/ui/form-items-container';
import MyModal from '@/ui/modal';

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
  const [openGenderMenu, setOpenGenderMenu] = useState(false);

  const formItems: FormItem[] = [
    {
      label: 'Full Name',
      value: formData.displayName,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormField('displayName', e.target.value),
    },
    {
      label: 'Email',
      value: formData.email,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormField('email', e.target.value),
    },
    {
      label: 'Password',
      value: formData.password,
      type: 'password',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormField('password', e.target.value),
    },
    {
      label: 'Confirm Password',
      value: formData.confirmPassword,
      type: 'password',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormField('confirmPassword', e.target.value),
    },
    {
      label: 'Gender',
      value: formData.gender,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormField('gender', e.target.value),
      customElement: () => (
        <FormItemDropdownMenu<Gender>
          value={formData.gender}
          values={Object.values(Gender)}
          onItemSelect={(item: Gender) => {
            setFormField('gender', item);
          }}
          open={openGenderMenu}
          setOpen={setOpenGenderMenu}
        />
      ),
    },
    {
      label: 'Date of Birth',
      value: formData.birthDate,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormField('birthDate', e.target.value),
      customElement: () => {
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={formData.birthDate ? dayjs(formData.birthDate) : null}
              onChange={(newValue) => {
                try {
                  if (newValue) setFormField('birthDate', newValue.toDate());
                  else setFormField('birthDate', undefined);
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
  ];

  return (
    <>
      <MyModal
        isOpen={open}
        setIsOpen={(open) => setOpen(open)}
        onCancel={() => {
          setFile(undefined);
          setTempPhotoURL(undefined);
          clearFormData();
          setOpen(false);
        }}
        cancelText="Close"
        sx={{
          minWidth: 400,
        }}
        dialogueContentSx={{
          minWidth: 400,
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          mx="auto"
          gap={2}
        >
          <Typography
            variant="h5"
            textAlign="center"
            lineHeight={1}
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
            containerSx={{
              width: 'fit-content',
              margin: '0 auto',
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
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <FormItemsContainer formItems={formItems} />
            <Button
              size="small"
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2, justifySelf: 'center' }}
            >
              Register
            </Button>
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
