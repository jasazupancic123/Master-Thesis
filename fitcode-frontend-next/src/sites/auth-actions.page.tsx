'use client';

import { useSearchParams } from 'next/navigation';
import type { JSX } from 'react';

import ResetPasswordPage from '@/sites/reset-password.page';

export default function AuthActionsPage() {
  // parse mode and oobCode from query
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  let page: JSX.Element | null = null;
  switch (mode) {
    case 'resetPassword':
      page = <ResetPasswordPage oobCode={oobCode} />;
      break;
  }

  return page;
}
