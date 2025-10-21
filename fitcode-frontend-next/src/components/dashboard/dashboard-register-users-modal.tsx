'use client';

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import useInstitutionMembers from './hooks/use-institution-members.hook';
import useRegisterMemberForm from './hooks/use-register-member-form.hook';
import type { UserRole } from '@/core/profile/enum/user-role.enum';
import MyModal from '@/util/modal';

interface Props {
  registerRole: UserRole;
}

export default function RegisterUsersDashboard({ registerRole }: Props) {
  const { formData, setFormField } = useRegisterMemberForm();
  const {
    openModal,
    setOpenModal,
    existingUser,
    setExistingUser,
    isUploadingMembers,
    registerUser,
    addUser,
  } = useInstitutionMembers();

  return (
    <>
      <Box maxWidth={400} mx="auto">
        <Typography
          variant="h5"
          gutterBottom
          mb={2}
          textAlign="center"
          width="100%"
        >
          Register {registerRole[0].toUpperCase() + registerRole.slice(1)}
        </Typography>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await registerUser(registerRole);
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
              onChange={(e) => setFormField('confirmPassword', e.target.value)}
              fullWidth
              required
            />

            <Button type="submit" variant="contained" color="primary" fullWidth>
              Register
            </Button>
          </Stack>
        </form>
      </Box>

      <MyModal
        isOpen={openModal}
        setIsOpen={(open) => setOpenModal(open)}
        onConfirm={() => addUser(existingUser)}
        onCancel={() => {
          setOpenModal(false);
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
