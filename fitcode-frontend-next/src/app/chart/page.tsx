'use client';

import withAuth from '@/components/with-auth';
import { UserRole } from '@/controller/user/enum/user-role.enum';

function Page() {
  return (
    <div>
      <h1>Chart</h1>
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);
