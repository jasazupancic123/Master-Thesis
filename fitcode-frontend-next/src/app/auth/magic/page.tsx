'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { AuthController } from '@/core/auth/auth.controller';
import { lib } from '@/lib';
import { SIGN_IN_REDIRECT_MAPPER } from '@/lib/common/const/nav.const';
import { useAuth } from '@/store/auth.provider';

export default function Page() {
  const router = useRouter();
  const { handleUserChange } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing token');
      return;
    }

    async function login() {
      try {
        const { firebaseToken } = await AuthController.getInstance().verifyLink(
          token!
        );

        const result =
          await lib.firebase.auth.signInWithCustomToken(firebaseToken);
        const idToken = await result.user.getIdToken();
        const user = await AuthController.getInstance().sessionLogin(idToken);

        const { role } = handleUserChange(user);
        if (role) {
          toast.success('Signed in successfully');
          router.push(SIGN_IN_REDIRECT_MAPPER[role]?.href);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }

    login().then();
  }, [token]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {error ? <div>{error}</div> : <div>Logging you in...</div>}
    </Suspense>
  );
}
