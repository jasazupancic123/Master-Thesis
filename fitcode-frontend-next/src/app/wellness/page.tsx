'use client';

import toast from 'react-hot-toast';
import UserWellnessForm from '@/components/user-wellness-form';
import withAuth from '@/components/with-auth';
import { useAppContext } from '@/context/app-provider';
import { useFetch } from '@/hook/use-fetch';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import { UserMeta } from '@/controller/user/type/user-meta.type';
import { UserController } from '@/controller/user/user.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';

function Page() {
  const { token } = useAppContext();
  const wellness = useFetch<UserMeta>('/user/me/meta');
  const [disabled, setDisabled] = useState(false);

  async function submitWellness(data: Omit<UserMeta, 'userId'>) {
    try {
      await UserController.saveMeta(token, data);
      toast.success('Successfully submitted wellness');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'An error occurred');
    }
  }

  useEffect(() => {
    if (wellness?.data) setDisabled(true);
  }, [wellness.data]);

  if (wellness.loading) return <div>Loading...</div>;

  return (
    <Box height="100%">
      <UserWellnessForm
        initialData={wellness.data}
        onSubmit={submitWellness}
        disabled={disabled}
        setDisabled={setDisabled}
      />
    </Box>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);
