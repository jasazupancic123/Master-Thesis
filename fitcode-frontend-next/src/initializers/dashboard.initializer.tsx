'use client';

import { useEffect, useState } from 'react';

import { useNestBackendFetch } from '@/common/hooks/use-fetch.hook';
import type { ChildrenProps } from '@/common/type/props.type';
import { GroupController } from '@/controller/group/group.controller';
import { GroupService } from '@/controller/group/group.service';
import { InstitutionService } from '@/controller/institution/institution.service';
import type { UserEntity } from '@/controller/user/type/user.type';
import DashboardLayout from '@/sites/dashboard.layout';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import type { DashboardPageProps } from '@/store/dashboard.provider';
import { DashboardProvider } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function DashboardInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<DashboardPageProps | null>(null);
  const auth = useAuthenticatedAuth();
  const controller = GroupController.getInstance(auth.token);

  const { users, institutions: allInstitutions } = useMain();

  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [members, setMembers] = useState<UserEntity[]>([]);

  const { data: fetchedMembers, refetch: refetchMembers } = useNestBackendFetch<
    UserEntity[]
  >(`/institution/${institutionId}/find/all`, { enabled: !!institutionId }); // only fetch when id is defined

  useEffect(() => {
    if (!state || !state.selectedInstitution) {
      setInstitutionId(null);
      return;
    }
    setInstitutionId(state.selectedInstitution.id);
  }, [state, state?.selectedInstitution]);

  useEffect(() => {
    if (fetchedMembers) {
      setMembers(fetchedMembers);
      setState((prev) => {
        if (!prev) return null;

        return { ...prev, members: fetchedMembers };
      });
    }
  }, [fetchedMembers]);

  useEffect(() => {
    async function init() {
      try {
        const institutions = InstitutionService.mapUsers(
          allInstitutions,
          users
        );

        const selectedInstitution = institutions?.[0] ?? null;
        if (selectedInstitution) {
          const groups = await controller.findAllByInstitution(
            selectedInstitution.id
          );

          for (const group of groups) GroupService.mapMembers(group, users);

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
        console.error('Error during dashboard initialization:', e);
        setState(null);
      }
    }

    init().then();
  }, []);

  if (!state) return <div>Loading dashboard...</div>;

  return (
    <DashboardProvider {...state}>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  );
}
