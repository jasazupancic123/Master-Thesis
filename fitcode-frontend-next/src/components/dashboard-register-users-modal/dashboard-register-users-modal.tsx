'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import LoadingOverlay from '../loading-overlay/loading-overlay';
import MyModal from '../modal/modal';
import { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import type { User } from '@/controller/user/type/user.type';
import { useDashboard } from '@/store/dashboard-provider';
import { useMain } from '@/store/main-provider';

const commonService = CommonService.instance;
const firebaseService = commonService.firebase;

interface RegisterUsersDashboardProps {
  registerRole: UserRole;
}

export default function RegisterUsersDashboard(
  props: RegisterUsersDashboardProps
) {
  const { registerRole } = props;

  const router = useRouter();

  const { users } = useMain();
  const {
    selectedInstitution,
    setSelectedInstitution,
    refetchUsers,
    refetchMembers,
  } = useDashboard();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [openModal, setOpenModal] = useState(false);
  const [existingUser, setExistingUser] = useState<User | null>(null);
  const [isUploadingMembers, setIsUploadingMembers] = useState(false);

  // refetch users and update institution's athletes or trainers
  useEffect(() => {
    if (
      !formData.displayName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setIsUploadingMembers(false);
      return;
    }

    const user = users?.find((user) => user.email === formData.email);

    setFormData({
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    if (!user || !selectedInstitution) {
      setIsUploadingMembers(false);
      return;
    }

    if (registerRole === UserRole.TRAINER) {
      handleApiRequest(
        router,
        () =>
          InstitutionController.addTrainer(selectedInstitution.id, {
            userId: user.uid,
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedTrainerIds = prev.trainerIds
              ? [...prev.trainerIds, user.uid]
              : [user.uid];

            const updatedTrainers = prev.trainers
              ? [...prev.trainers, user]
              : [user];

            return {
              ...prev,
              trainers: updatedTrainers,
              trainerIds: updatedTrainerIds,
            };
          });

          toast.success('Successfully added trainer');
        },
        undefined,
        'Failed to register trainer'
      );
    } else if (registerRole === UserRole.ATHLETE) {
      handleApiRequest(
        router,
        () =>
          InstitutionController.addAthlete(selectedInstitution.id, {
            userId: user.uid,
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedAthleteIds = prev.athleteIds
              ? [...prev.athleteIds, user.uid]
              : [user.uid];

            const updatedAthletes = prev.athletes
              ? [...prev.athletes, user]
              : [user];

            return {
              ...prev,
              athletes: updatedAthletes,
              athleteIds: updatedAthleteIds,
            };
          });

          toast.success('Successfully added athlete');
        },
        undefined,
        'Failed to register athlete'
      );
    }

    setIsUploadingMembers(false);
  }, [users]);

  const handleAddExistingUser = () => {
    if (!existingUser || !selectedInstitution) return;

    if (registerRole === UserRole.TRAINER) {
      handleApiRequest(
        router,
        () =>
          InstitutionController.addTrainer(selectedInstitution.id, {
            userId: existingUser.uid,
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedTrainerIds = prev.trainerIds
              ? [...prev.trainerIds, existingUser.uid]
              : [existingUser.uid];

            const updatedTrainers = prev.trainers
              ? [...prev.trainers, existingUser]
              : [existingUser];

            return {
              ...prev,
              trainers: updatedTrainers,
              trainerIds: updatedTrainerIds,
            };
          });

          toast.success('Successfully added trainer');
        },
        undefined,
        'Failed to register trainer'
      );
    } else if (registerRole === UserRole.ATHLETE) {
      handleApiRequest(
        router,
        () =>
          InstitutionController.addAthlete(selectedInstitution.id, {
            userId: existingUser.uid,
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedAthleteIds = prev.athleteIds
              ? [...prev.athleteIds, existingUser.uid]
              : [existingUser.uid];

            const updatedAthletes = prev.athletes
              ? [...prev.athletes, existingUser]
              : [existingUser];

            return {
              ...prev,
              athletes: updatedAthletes,
              athleteIds: updatedAthleteIds,
            };
          });

          toast.success('Successfully added athlete');
        },
        undefined,
        'Failed to register athlete'
      );
    }

    setOpenModal(false);
    setExistingUser(null);
    setFormData({
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const input = {
      displayName: formData.displayName,
      email: formData.email,
      password: formData.password,
      role: registerRole,
    };

    const userAlreadyInInstitution =
      registerRole === UserRole.ATHLETE
        ? selectedInstitution?.athletes?.some(
            (athlete) => athlete.email === input.email
          )
        : selectedInstitution?.trainers?.some(
            (trainer) => trainer.email === input.email
          );

    if (userAlreadyInInstitution) {
      toast.error(
        `User with email ${input.email} is already registered as a ${registerRole}.`
      );
      return;
    }

    const existingUser = users?.find((user) => user.email === input.email);

    if (existingUser) {
      setExistingUser(existingUser);
      setOpenModal(true);
      return;
    }

    setIsUploadingMembers(true);

    handleApiRequest(
      router,
      () => firebaseService.functions.createUserWithRole(input),
      () => {
        refetchUsers();
        refetchMembers();
      },
      () => {
        setIsUploadingMembers(false);
      },
      'Failed to register user'
    );
  };

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
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Display Name"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
        onConfirm={() => handleAddExistingUser()}
        onCancel={() => {
          setOpenModal(false);
          setExistingUser(null);
        }}
      >
        User with email &quot;{existingUser?.email}&quot; already exists. Do you
        want to add them to the institution?
      </MyModal>

      {isUploadingMembers && <LoadingOverlay title="Registering..." />}
    </>
  );
}
