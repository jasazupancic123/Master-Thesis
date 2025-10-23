'use client';

import { useEffect, useState } from 'react';

import { DashboardUserEditProvider } from '@/components/dashboard/context/user-edit.context';
import { core } from '@/core/core.service';
import type { Profile } from '@/core/profile/type/user.type';
import { useFetch } from '@/hooks/use-fetch.hook';
import DashboardLayout from '@/sites/dashboard.layout';
import type { Props } from '@/store/dashboard.provider';
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
}: React.PropsWithChildren & WithInstitutionProps) {
  const [state, setState] = useState<Props | null>(null);
  const { users, institutions: allInstitutions, groups: allGroups } = useMain();
  const [members, setMembers] = useState<Profile[]>([]);

  const { data: fetchedMembers, refetch: refetchMembers } = useFetch<Profile[]>(
    `/institution/${institutionId}/members`,
    { enabled: !!institutionId }
  ); // only fetch when id is defined

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
    const institutions = core.institution.mapUsers(allInstitutions, users);
    const selectedInstitution = institutions.find(
      (inst) => inst.id === institutionId
    );

    if (!selectedInstitution) return;

    const groups = allGroups.filter(
      (g) => g.institutionId === selectedInstitution.id
    );

    for (const group of groups) core.group.mapMembers(group, users);
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
      <DashboardUserEditProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardUserEditProvider>
    </DashboardProvider>
  );
}
