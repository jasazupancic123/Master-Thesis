'use client';

import toast from 'react-hot-toast';
import UserWellnessForm from '@/user/components/user-wellness-form';
import withAuth from '@/common/components/with-auth';
import { UserRole } from '@/user/enum/user-role.enum';
import { useAppContext } from '@/context/app-provider';
import { useEffect, useState } from 'react';
import { UserController } from '@/user/user.controller';
import { CreateWellness, isWellness } from '@/user/type/wellness.type';

function Page() {
  const { token } = useAppContext();
  const [wellness, setWellness] = useState({
    loading: false,
    data: null as CreateWellness | null,
  });

  async function createWellness(data: CreateWellness) {
    try {
      await UserController.createWellness(token, data);
      toast.success('Successfully submitted wellness');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'An error occurred');
    }
  }

  useEffect(() => {
    async function getWellnessForToday() {
      setWellness(prev => ({ ...prev, loading: true }));

      try {
        const response = await UserController.getWellness(token);
        setWellness({
          loading: false,
          data: !isWellness(response) ? null : response,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setWellness(prev => ({ ...prev, loading: false }));
      }
    }

    getWellnessForToday().then();
  }, [token]);

  if (wellness.loading)
    return <div>Loading...</div>;

  return (
    <div>
      <UserWellnessForm onSubmit={createWellness} disabled={!!wellness.data} />
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);