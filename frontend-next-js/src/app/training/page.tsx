'use client';

import withAuth from '@/hoc/with-auth';
import { UserRole } from '@/enum/user-role.enum';
import { useFetch } from '@/hook/use-fetch';
import { FitcodeApi } from '@/util/api';
import { Group } from '@/type/group.type';

function Page() {
  const [groups] = useFetch<Group[]>(FitcodeApi.URL.athleteGroups());
  console.log(groups);

  return (
    <div>
      Training
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);