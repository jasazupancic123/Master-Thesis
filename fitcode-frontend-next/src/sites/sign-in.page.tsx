'use client';

import { TextField } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';

import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import { AuthController } from '@/core/auth/auth.controller';
import { lib } from '@/lib';
import { SIGN_IN_REDIRECT_MAPPER } from '@/lib/common/const/nav.const';
import { HERO_NAVBAR_HEIGHT } from '@/lib/common/const/state';
import { STRING_CONST } from '@/lib/common/const/string.const';
import { useAuth } from '@/store/auth.provider';

export default function SignInPage() {
  const theme = useTheme();
  const router = useRouter();
  const { handleUserChange } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const hasToastedRef = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const result = await lib.firebase.auth.login(email, password);
      const idToken = await result.user.getIdToken();
      const user = await AuthController.getInstance().sessionLogin(idToken);

      const { role } = handleUserChange(user);
      if (role) {
        if (!hasToastedRef.current) {
          toast.success('Signed in successfully');
          hasToastedRef.current = true;
        }
        router.push(SIGN_IN_REDIRECT_MAPPER[role]?.href);
      }
    } catch (e) {
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

          <Box component="form" onSubmit={handleSubmit} noValidate>
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

            <TextField
              id="password"
              type="password"
              variant="standard"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Log in
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
