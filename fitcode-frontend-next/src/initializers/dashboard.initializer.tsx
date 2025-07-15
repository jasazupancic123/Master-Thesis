'use client';

import { useEffect, useState } from 'react';
import {
  DashboardPageProps,
  DashboardProvider,
} from '@/store/dashboard-provider';
import DashboardLayout from '@/sites/dashboard.layout';
import { ApiUtil } from '@/common/service/util/api.util';
import { UserController } from '@/controller/user/user.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { GroupController } from '@/controller/group/group.controller';
import Loading from '../components/loading/loading';
import { ChildrenProps } from '@/common/type/props.type';

export default function DashboardInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<DashboardPageProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const profile = await UserController.findMe();
        const users = await UserController.findAll();
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
          profile,
          role: profile.customClaims.role,
          institutions,
          selectedInstitution,
          users,
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
