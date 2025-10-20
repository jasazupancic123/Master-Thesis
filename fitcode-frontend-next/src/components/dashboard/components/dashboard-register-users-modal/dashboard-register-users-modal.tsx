'use client';

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { handleChange, handleSubmit } from './actions/actions-form';
import { handleAddExistingUser } from './actions/actions-register-users';
import useInstitutionRegisterMemberForm from './hooks/use-form';
import useInstitutionMembers from './hooks/use-institution-members';
import { InstitutionController } from '@/core/institution/institution.controller';
import type { UserRole } from '@/core/profile/enum/user-role.enum';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/util/modal/modal';

interface RegisterUsersDashboardProps {
  registerRole: UserRole;
}

export default function RegisterUsersDashboard(
  props: RegisterUsersDashboardProps
) {
  const router = useRouter();

  const { registerRole } = props;

  const mainContext = useMain();
  const dashboardContext = useDashboard();
  const institutionRegisterMemberForm = useInstitutionRegisterMemberForm();
  const institutionMembersContext = useInstitutionMembers(
    registerRole,
    institutionRegisterMemberForm
  );

  const { formData } = institutionRegisterMemberForm;

  const {
    isUploadingMembers,
    existingUser,
    setExistingUser,
    openModal,
    setOpenModal,
  } = institutionMembersContext;

  const controller = InstitutionController.getInstance();

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
          onSubmit={(e) =>
            handleSubmit(
              { e, registerRole, router },
              {
                useMain: mainContext,
                useDashboard: dashboardContext,
                useInstitutionMembers: institutionMembersContext,
                useInstitutionRegisterMemberForm: institutionRegisterMemberForm,
              }
            )
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Display Name"
              name="displayName"
              value={formData.displayName}
              onChange={(e) =>
                handleChange(
                  { e: e as React.ChangeEvent<HTMLInputElement> },
                  {
                    useInstitutionRegisterMemberForm:
                      institutionRegisterMemberForm,
                  }
                )
              }
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                handleChange(
                  { e: e as React.ChangeEvent<HTMLInputElement> },
                  {
                    useInstitutionRegisterMemberForm:
                      institutionRegisterMemberForm,
                  }
                )
              }
              fullWidth
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                handleChange(
                  { e: e as React.ChangeEvent<HTMLInputElement> },
                  {
                    useInstitutionRegisterMemberForm:
                      institutionRegisterMemberForm,
                  }
                )
              }
              fullWidth
              required
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleChange(
                  { e: e as React.ChangeEvent<HTMLInputElement> },
                  {
                    useInstitutionRegisterMemberForm:
                      institutionRegisterMemberForm,
                  }
                )
              }
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
        onConfirm={() =>
          handleAddExistingUser(
            { registerRole, router, controller },
            {
              useDashboard: dashboardContext,
              useInstitutionMembers: institutionMembersContext,
              useInstitutionRegisterMemberForm: institutionRegisterMemberForm,
            }
          )
        }
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
          sx={{
            zIndex: 130000,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <CircularProgress size={24} />
          <Typography fontSize={20}>Registering...</Typography>
        </Box>
      )}
    </>
  );
}
