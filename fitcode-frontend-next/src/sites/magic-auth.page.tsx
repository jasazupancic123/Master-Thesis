'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { AuthController } from '@/core/auth/auth.controller';
import { lib } from '@/lib';
import { SIGN_IN_REDIRECT_MAPPER } from '@/lib/common/const/nav.const';
import { useAuth } from '@/store/auth.provider';
import Alert from '@/ui/alert';

export default function MagicAuthPage() {
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
        const { token: firebaseToken, redirect } =
          await AuthController.getInstance().verifyLink(token!);

        const result =
          await lib.firebase.auth.signInWithCustomToken(firebaseToken);
        const idToken = await result.user.getIdToken();
        const user = await AuthController.getInstance().sessionLogin(idToken);

        const { role } = handleUserChange(user);
        if (role) {
          toast.success('Signed in successfully');
          router.push(redirect || SIGN_IN_REDIRECT_MAPPER[role]?.href);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }

    login().then();
  }, [token]);

  if (error) return <Alert type="error" errorMessage={error} />;
  return <Alert type="loading" />;
}
