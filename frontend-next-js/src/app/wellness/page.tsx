'use client';

import { UserWellness } from '@/type/user-wellness.type';
import { FitcodeApi } from '@/util/api';
import toast from 'react-hot-toast';
import UserWellnessForm from '@/component/user-wellness-form';
import withAuth from '@/hoc/with-auth';
import { UserRole } from '@/enum/user-role.enum';
import { AppContextType, useAppContext } from '@/context/app-provider';
import { useEffect, useState } from 'react';

function Page() {
  const { token } = useAppContext() as AppContextType;
  const [wellness, setWellness] = useState({
    loading: false,
    data: null as UserWellness | null,
  });

  async function createWellness(data: Partial<UserWellness>) {
    try {
      await FitcodeApi.createWellness(data, token);
      toast.success('Successfully submitted wellness');
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'An error occurred');
    }
  }

  useEffect(() => {
    async function getWellnessForToday() {
      setWellness(prev => ({ ...prev, loading: true }));

      try {
        const response = await FitcodeApi.getWellnessForToday(token);
        setWellness({
          loading: false,
          data: !response.id ? null : response,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setWellness(prev => ({ ...prev, loading: false }));
      }
    }

    getWellnessForToday().then();
  }, []);

  if (wellness.loading)
    return <div>Loading...</div>;

  return (
    <div>
      <UserWellnessForm onSubmit={createWellness} disabled={!!wellness.data} />
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);