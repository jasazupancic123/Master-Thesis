'use client';

import withAuth from '@/common/components/with-auth';
import { UserRole } from '@/user/enum/user-role.enum';

function Page() {
  // const groups = useFetch<Group[]>(GroupController.URL.athleteGroups());
  // console.log(groups.data);

  return (
    <div>
      Training
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);