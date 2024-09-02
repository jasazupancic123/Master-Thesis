'use client';

import withAuth from '@/hoc/with-auth';
import { UserRole } from '@/enum/user-role.enum';

function Page() {
  return (
    <div>
      <h1>Chart</h1>
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);