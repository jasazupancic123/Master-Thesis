'use client';

import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import {
  LINK_GROUPS,
  LINK_TRAININGS,
  LINK_USERS,
  LINKS_AUTH,
} from '@/common/constant/navigation.constant';
import { CommonService } from '@/common/service/common.service';
import { FirebaseAuthUtil } from '@/common/service/util/firebase-auth.util';
import HeroNavbar from '@/components/hero-navbar';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Grid2, TextField, ThemeProvider } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useLocalStorage } from 'usehooks-ts';
import { signInUpTheme } from '../style';

const mapper = {
  [UserRole.ATHLETE]: LINK_TRAININGS,
  [UserRole.TRAINER]: LINK_GROUPS,
  [UserRole.MANAGER]: LINK_GROUPS,
  [UserRole.ADMIN]: LINK_USERS,
};

const commonService = CommonService.instance;

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [_, setToken] = useLocalStorage(FIREBASE_COOKIE_NAME, '');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const result = await FirebaseAuthUtil.login(email, password);
      const tokenResult = await result.user.getIdTokenResult();

      const role = tokenResult.claims.role as UserRole;
      setToken(tokenResult.token);
      commonService.browser.setClientCookie(
        FIREBASE_COOKIE_NAME,
        tokenResult.token,
        7
      );

      toast.success('Logged in successfully');
      router.push(mapper[role].href);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <>
      <HeroNavbar />
      <ThemeProvider theme={signInUpTheme}>
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
              backgroundColor: '#FFFFFF',
              padding: 4,
              borderRadius: 3,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
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
                sx={{ mt: 3, mb: 2, px: 2, py: 2 }}
              >
                {LINKS_AUTH.login.label}
              </Button>

              <Grid2 container sx={{ justifyContent: 'center' }}>
                <Grid2>
                  <Typography>
                    Don&apos;t have an account?{' '}
                    <Link
                      href={LINKS_AUTH.register.href}
                      style={{ textDecoration: 'none', color: '#0f9d58' }}
                    >
                      Sign Up
                    </Link>
                  </Typography>
                </Grid2>
              </Grid2>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </>
  );
}
