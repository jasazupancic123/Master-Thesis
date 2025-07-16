'use client';

import { useEffect, useState } from 'react';
import {
  DashboardPageProps,
  DashboardProvider,
} from '@/store/dashboard-provider';
import DashboardLayout from '@/sites/dashboard.layout';
import { InstitutionService } from '@/controller/institution/institution.service';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { GroupController } from '@/controller/group/group.controller';
import Loading from '../components/loading/loading';
import { ChildrenProps } from '@/common/type/props.type';
import { useMain } from '@/store/main-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export default function DashboardInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<DashboardPageProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const { profile, users } = useMain();

  useEffect(() => {
    async function init() {
      try {
        const roles = profile.customClaims.role;

        if (
          !roles.includes(UserRole.TRAINER) &&
          !roles.includes(UserRole.MANAGER) &&
          !roles.includes(UserRole.ADMIN)
        )
          return setUnauthorized(true);

        const institutions = InstitutionService.mapUsers(
          await InstitutionController.findAll(),
          users
        );

        const selectedInstitution = institutions?.[0] ?? null;

        if (selectedInstitution) {
          const groups = await GroupController.findAllByInstitution(
            selectedInstitution.id
          );
          selectedInstitution.groups = groups;
        }

        setState({
          institutions,
          selectedInstitution,
        });
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return (
    <DashboardProvider {...state}>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  );
}
