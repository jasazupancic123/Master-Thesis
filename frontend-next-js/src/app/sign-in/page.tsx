'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Grid, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import HeroNavbar from '@/components/hero-navbar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { LINK_PROFILE, LINKS_AUTH } from '@/common/constant/navigation.constant';
import toast from 'react-hot-toast';
import { FirebaseAuthUtil } from '@/common/service/util/firebase-auth.util';
import { sleep } from '@/util/sleep';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { useLocalStorage } from 'usehooks-ts';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [token, setToken] = useLocalStorage(FIREBASE_COOKIE_NAME, '');

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const result = await FirebaseAuthUtil.login(email, password);
      const tokenResult = await result.user.getIdTokenResult();
      setToken(tokenResult.token);
      toast.success('Logged in successfully');

      await sleep(0.25);
      router.push(LINK_PROFILE.href);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <>
      <HeroNavbar />

      <Box sx={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><LockOutlinedIcon /></Avatar>
        <Typography component="h1" variant="h5">{LINKS_AUTH.login.label}</Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
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

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            {LINKS_AUTH.login.label}
          </Button>

          <Grid container>
            <Grid item>
              <Link href={LINKS_AUTH.register.href} style={{ textDecoration: 'none', color: '#1976d2' }}>
                Don't have an account? Sign Up
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
}