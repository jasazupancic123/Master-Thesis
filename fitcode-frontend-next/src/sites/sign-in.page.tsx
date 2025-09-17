'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { TextField } from '@mui/material';
import { useTheme } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import React from 'react';
import toast from 'react-hot-toast';

import { FIREBASE_AUTH_ID_TOKEN } from '@/common/config/firebase.config';
import {
  LINKS_AUTH,
  SIGN_IN_REDIRECT_MAPPER,
} from '@/common/constant/navigation.constant';
import { FirebaseAuthUtil } from '@/common/firebase/firebase-auth.util';
import { CommonService } from '@/common/service/common.service';
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
      <HeroNavbar />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            justifyItems: 'center',
            padding: 4,
            borderRadius: 3,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: theme.palette.primary.main }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            {LINKS_AUTH.login.label}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                px: 2,
                py: 2,
                backgroundColor: theme.palette.primary.main,
              }}
            >
              {LINKS_AUTH.login.label}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
