import { Suspense } from 'react';

import MagicAuthPage from '@/sites/magic-auth.page';

export default function Page() {
  return (
    <Suspense>
      <MagicAuthPage />;
    </Suspense>
  );
}
