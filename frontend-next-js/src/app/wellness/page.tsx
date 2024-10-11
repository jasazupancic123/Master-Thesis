'use client';

import toast from 'react-hot-toast';
import UserWellnessForm from '@/user/components/user-wellness-form';
import withAuth from '@/common/components/with-auth';
import { UserRole } from '@/user/enum/user-role.enum';
import { useAppContext } from '@/context/app-provider';
import { UserController } from '@/user/user.controller';
import { CreateWellness } from '@/user/type/wellness.type';
import { useFetch } from '@/hook/use-fetch';
import { Wellness } from '@/user/entity/wellness.entity';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';

function Page() {
  const { token } = useAppContext();
  const wellness = useFetch<Wellness>(UserController.URL.wellness());
  const [disabled, setDisabled] = useState(false);

  async function submitWellness(data: CreateWellness) {
    try {
      await UserController.submitWellness(token, data);
      toast.success('Successfully submitted wellness');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'An error occurred');
    }
  }

  useEffect(() => {
    if (wellness?.data)
      setDisabled(true);
  }, [wellness.data]);

  if (wellness.loading)
    return <div>Loading...</div>;

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