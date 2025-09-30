'use client';

import { useEffect, useState } from 'react';

import { useNestBackendFetch } from '@/common/hooks/use-fetch.hook';
import type { ChildrenProps } from '@/common/type/props.type';
import { GroupService } from '@/controller/group/group.service';
import { InstitutionService } from '@/controller/institution/institution.service';
import type { Profile } from '@/controller/profile/type/user.type';
import DashboardLayout from '@/sites/dashboard.layout';
import type { DashboardPageProps } from '@/store/dashboard.provider';
import { DashboardProvider } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

type WithInstitutionProps = {
  institutionId: string;
};

function withInstitution<T>(
  Component: React.ComponentType<T & WithInstitutionProps>
) {
  return function WrappedComponent(props: T) {
    const { institutions } = useMain();
    if (institutions.length === 0) return null;
    return <Component {...props} institutionId={institutions[0]?.id} />;
  };
}

export default withInstitution(DashboardInitializer);

function DashboardInitializer({
  children,
  institutionId,
}: ChildrenProps & WithInstitutionProps) {
  const [state, setState] = useState<DashboardPageProps | null>(null);
  const { users, institutions: allInstitutions, groups: allGroups } = useMain();
  const [members, setMembers] = useState<Profile[]>([]);

  const { data: fetchedMembers, refetch: refetchMembers } = useNestBackendFetch<
    Profile[]
  >(`/institution/${institutionId}/find/all`, { enabled: !!institutionId }); // only fetch when id is defined

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
    const institutions = InstitutionService.mapUsers(allInstitutions, users);
    const selectedInstitution = institutions.find(
      (inst) => inst.id === institutionId
    );

    if (!selectedInstitution) return;

    const groups = allGroups.filter(
      (g) => g.institutionId === selectedInstitution.id
    );

    for (const group of groups) GroupService.mapMembers(group, users);
    selectedInstitution.groups = groups;

    setState({
      institutions,
      selectedInstitution,
      members: members || [],
      refetchMembers,
      setMembers,
    });
  }, []);

  if (!state) return null;
  return (
    <DashboardProvider {...state!} setMembers={setMembers}>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  );
}
