'use client';

import { Suspense } from 'react';

import AuthActionsPage from '@/sites/auth-actions.page';

export default function Page() {
  return (
    <Suspense>
      <AuthActionsPage />
    </Suspense>
  );
}
