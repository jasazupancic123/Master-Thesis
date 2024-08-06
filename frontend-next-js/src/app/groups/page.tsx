'use client';

import { useFetch } from '@/hook/use-fetch';
import { User } from '@/type/user.type';
import { UserRole } from '@/enum/user-role.enum';
import TrainerPage from './trainer.page';
import Grid from '@mui/material/Unstable_Grid2';
import withAuth from '@/hoc/with-auth';
import React from 'react';

function Page() {
  // profile data and users
  const [profile, loadingProfile, errorProfile] = useFetch<User>('/user/me/profile');
  const [users, loadingUsers, errorUsers, _, setUsers] = useFetch<User[]>('/user');

  if (loadingProfile || loadingUsers)
    return <div>Loading...</div>;

  if (errorProfile || errorUsers)
    return <div>Error</div>;

  if (profile.customClaims?.role?.includes(UserRole.TRAINER))
    return <TrainerPage users={users} setUsers={setUsers} />;

  return (
    <>
      <Grid container spacing={2}>
        {/* Profile */}
        <Grid xs={8}>
          <h1>Welcome!</h1>
        </Grid>
      </Grid>
    </>
  );
}

export default withAuth(Page);