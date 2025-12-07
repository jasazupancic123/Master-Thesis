'use client';

import { TextField } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { FormEvent } from 'react';
import React from 'react';
import toast from 'react-hot-toast';

import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import { lib } from '@/lib';
import { HERO_NAVBAR_HEIGHT } from '@/lib/common/const/state';
import { STRING_CONST } from '@/lib/common/const/string.const';
import Alert from '@/ui/alert';

interface Props {
  oobCode: string | null;
}

export default function ResetPasswordPage({ oobCode }: Props) {
  const theme = useTheme();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!oobCode) return;
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await lib.firebase.auth.confirmPasswordReset(oobCode, password);
      toast.success('Password reset successfully');
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message);
    }
  }

  if (!oobCode)
    return (
      <Alert
        type="error"
        errorMessage="Invalid or missing password reset code"
        color="black"
      />
    );

  return (
    <>
      <HeroNavbar height={HERO_NAVBAR_HEIGHT} activeSection={null} />

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          justifyContent: 'center',
          backgroundColor: theme.palette.primary.main,
        }}
      >
        <Box
          width={300}
          sx={{
            justifyItems: 'center',
            padding: 4,
            borderRadius: 3,
            mx: 'auto',
          }}
        >
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 24,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            {STRING_CONST.doItRight}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            display="flex"
            flexDirection="column"
          >
            <TextField
              id="password"
              variant="standard"
              label="New Password"
              margin="normal"
              required
              fullWidth
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={lib.mui.getBlackTextFieldStyle(theme)}
            />

            <TextField
              id="confirm-password"
              variant="standard"
              label="Confirm New Password"
              margin="normal"
              required
              fullWidth
              name="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={lib.mui.getBlackTextFieldStyle(theme)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                px: 2,
                py: 1,
                backgroundColor: theme.palette.text.secondary,
                color: theme.palette.text.primary,
                borderRadius: 20,
              }}
            >
              Reset Password
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
