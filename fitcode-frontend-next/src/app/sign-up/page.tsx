'use client';

import { LINKS_AUTH } from '@/common/constant/navigation.constant';
import { CommonService } from '@/common/service/common.service';
import { FirebaseAuthUtil } from '@/common/service/util/firebase-auth.util';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Grid, TextField, ThemeProvider } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { signInUpTheme } from '../style';

export default function Page() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await FirebaseAuthUtil.register(
        email,
        password,
        `${firstName} ${lastName}`
      );

      toast.success('Account created successfully');
      router.push(LINKS_AUTH.login.href);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
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
          <Avatar sx={{ m: 1, bgcolor: '#1EB980' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            {LINKS_AUTH.register.label}
          </Typography>

          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, px: 2, py: 2, backgroundColor: '#1EB980' }}
            >
              {LINKS_AUTH.register.label}
            </Button>

            <Grid container sx={{ justifyContent: 'center' }}>
              <Grid item>
                <Link
                  href={LINKS_AUTH.login.href}
                  style={{ textDecoration: 'none', color: '#1EB980' }}
                >
                  Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
