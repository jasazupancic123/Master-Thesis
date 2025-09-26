'use client';

import { TextField } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import React from 'react';
import toast from 'react-hot-toast';

import { HERO_NAVBAR_HEIGHT } from '@/app/state';
import { FIREBASE_AUTH_ID_TOKEN } from '@/common/config/firebase.config';
import {
  LINKS_AUTH,
  SIGN_IN_REDIRECT_MAPPER,
} from '@/common/constant/navigation.constant';
import { FirebaseAuthUtil } from '@/common/firebase/firebase-auth.util';
import { CommonService } from '@/common/service/common.service';
import { BLACK_TEXT_FIELD_STYLE } from '@/common/util/styles.util';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import { useAuth } from '@/store/auth.provider';

const firebaseAuthUtil = FirebaseAuthUtil.getInstance();

export default function SignInPage() {
  const theme = useTheme();
  const router = useRouter();
  const { handleUserChange } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      CommonService.instance.browser.removeClientCookie(FIREBASE_AUTH_ID_TOKEN);
      const result = await firebaseAuthUtil.login(email, password);
      const { role } = await handleUserChange(result.user);
      if (role) {
        toast.success('Signed in successfully');
        router.push(SIGN_IN_REDIRECT_MAPPER[role]?.href);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <HeroNavbar height={HERO_NAVBAR_HEIGHT} />

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
            {LINKS_AUTH.login.label}
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
              sx={BLACK_TEXT_FIELD_STYLE}
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
              sx={BLACK_TEXT_FIELD_STYLE}
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
