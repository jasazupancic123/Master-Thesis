'use client';

import withAuth from '@/common/components/with-auth';
import { UserRole } from '@/user/enum/user-role.enum';
import { useFetch } from '@/hook/use-fetch';
import { Training } from '@/training/entity/training.entity';
import { GroupController } from '@/group/group.controller';

function Page() {
  const trainings = useFetch<Training[]>(GroupController.URL.trainings());
  console.log('user trainings:', trainings.data);

  return (
    <div>
      Training
    </div>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);