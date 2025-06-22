'use client';

import { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import toast from 'react-hot-toast';
import { handleApiRequest } from '@/common/type/state.type';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/store/dashboard-provider';
import { CommonService } from '@/common/service/common.service';
import { isAdmin, isManager } from '@/common/service/util/firebase-auth.util';

const commonService = CommonService.instance;
const firebaseService = commonService.firebase;

export default function RegisterUsersDashboard() {
  const router = useRouter();
  const { profile, users, refetchUsers, setSelectedInstitution } =
    useDashboard();

  const role = profile?.customClaims?.role || [];

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: role.includes(UserRole.ADMIN) ? UserRole.MANAGER : UserRole.ATHLETE,
    password: '',
    confirmPassword: '',
  });

  // refetch users and update institution's athletes or trainers
  useEffect(() => {
    if (
      !formData.displayName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.role
    )
      return;

    const role = formData.role;
    const user = users?.find((user) => user.email === formData.email);

    setFormData({
      displayName: '',
      email: '',
      role: UserRole.ATHLETE,
      password: '',
      confirmPassword: '',
    });

    if (!user) return;

    if (role === UserRole.ATHLETE) {
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
    } else if (role === UserRole.TRAINER) {
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
    }
  }, [users]);

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
      role: formData.role,
    };

    handleApiRequest(
      router,
      () => firebaseService.functions.createUserWithRole(input),
      () => {
        refetchUsers();

        toast.success('Successfully registered user');
      },
      undefined,
      'Failed to register user'
    );
  };

  return (
    <Box maxWidth={400} mx="auto" mt={5}>
      <Typography
        variant="h5"
        gutterBottom
        mb={2}
        textAlign="center"
        width="100%"
      >
        Register Users
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
            select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            fullWidth
          >
            {(isAdmin(role)
              ? [UserRole.MANAGER]
              : isManager(role)
                ? [UserRole.ATHLETE, UserRole.TRAINER]
                : []
            ).map((role_) => (
              <MenuItem key={role_} value={role_}>
                {role_.charAt(0).toUpperCase() + role_.slice(1)}
              </MenuItem>
            ))}
          </TextField>
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
  );
}
