'use client';

import withAuth from '@/common/components/with-auth';
import { UserRole } from '@/user/enum/user-role.enum';
import { useFetch } from '@/hook/use-fetch';
import { ApiUtil } from '@/common/service/util/api.util';
import { Group } from '@/group/type/group.type';

function Page() {
  const [groups] = useFetch<Group[]>(ApiUtil.URL.athleteGroups());
  console.log(groups);

  return (
    <div>
      Training
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);