'use client';

import { useState } from 'react';
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
import { UserController } from '@/controller/user/user.controller';
import { useDashboard } from '@/store/dashboard-provider';

export default function RegisterUsersDashboard() {
  const router = useRouter();
  const { setUsers, token } = useDashboard();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: UserRole.ATHLETE,
    password: '',
    confirmPassword: '',
  });

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
      () => UserController.registerUser(token, input),
      (user) => {
        setUsers((prev) => [...prev, user]);
        setFormData({
          displayName: '',
          email: '',
          role: UserRole.ATHLETE,
          password: '',
          confirmPassword: '',
        });
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
            {[UserRole.ATHLETE, UserRole.TRAINER].map((role) => (
              <MenuItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
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
