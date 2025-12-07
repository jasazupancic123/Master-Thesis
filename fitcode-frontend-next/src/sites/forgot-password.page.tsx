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
import { EMAIL_REGEX } from '@/core/const/web.const';
import { lib } from '@/lib';
import { HERO_NAVBAR_HEIGHT } from '@/lib/common/const/state';
import { STRING_CONST } from '@/lib/common/const/string.const';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const [email, setEmail] = React.useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (!email) throw new Error('Please enter your email address');
      if (!EMAIL_REGEX.test(email))
        throw new Error('Please enter a valid email address');

      await lib.firebase.auth.sendPasswordResetEmail(email);
      toast.success('Password reset email sent successfully');
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message);
    }
  }

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
              id="email"
              variant="standard"
              label="Email"
              margin="normal"
              required
              fullWidth
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

            <Typography
              variant="body2"
              justifySelf="end"
              textAlign="left"
              sx={{
                color: theme.palette.text.secondary,
                display: 'block',
                mt: 2,
              }}
            >
              * You will receive an email with instructions to reset your
              password.
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
