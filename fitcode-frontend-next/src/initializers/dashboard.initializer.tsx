'use client';

import { useEffect, useState } from 'react';

import Alert from '../components/alert/alert';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { useFetch } from '@/common/hooks/use-fetch.hook';
import type { ChildrenProps } from '@/common/type/props.type';
import { GroupController } from '@/controller/group/group.controller';
import { GroupService } from '@/controller/group/group.service';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import type { UserEntity } from '@/controller/user/type/user.type';
import DashboardLayout from '@/sites/dashboard.layout';
import type { DashboardPageProps } from '@/store/dashboard-provider';
import { DashboardProvider } from '@/store/dashboard-provider';
import { useMain } from '@/store/main-provider';

export default function DashboardInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<DashboardPageProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const { profile, users } = useMain();

  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [members, setMembers] = useState<UserEntity[]>([]);

  const { data: fetchedMembers, refetch: refetchMembers } = useFetch<
    UserEntity[]
  >(`${BACKEND_API_BASE_URL}/institution/${institutionId}/find/all`, {
    skip: !institutionId, // wait until we have ID
  });

  useEffect(() => {
    if (fetchedMembers) {
      setMembers(fetchedMembers);
      setState((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          members: fetchedMembers,
        };
      });
    }
  }, [fetchedMembers]);

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

          for (let group of groups)
            group = GroupService.mapMembers(group, users);

          selectedInstitution.groups = groups;
          setInstitutionId(selectedInstitution.id); //this triggers member fetch
        }

        setState({
          institutions,
          selectedInstitution,
          members: members || [],
          refetchMembers,
        });
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (unauthorized) return <Alert type="unauthorized" />;
  if (!state) return <Alert type="loading" />;

  return (
    <DashboardProvider {...state}>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  );
}
