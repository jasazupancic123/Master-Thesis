'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import {
  LINK_DASHBOARD_GROUPS,
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
} from '@/common/constant/navigation.constant';
import { useNestBackendFetch } from '@/common/hooks/use-fetch.hook';
import type { ILink } from '@/common/type/link.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { Profile } from '@/controller/profile/type/user.type';

interface DashboardContextProps {
  filter: ILink;
  setFilter: SetState<ILink>;
  institutions: Institution[];
  setInstitutions: SetState<Institution[]>;
  selectedInstitution: Institution | null;
  setSelectedInstitution: SetState<Institution | null>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
  selectedGroup: Group | null;
  setSelectedGroup: SetState<Group | null>;
  refetchUsers: () => void;
  members: Profile[];
  refetchMembers: (providedUrl?: string) => void;
}

export interface DashboardPageProps {
  institutions: Institution[];
  selectedInstitution: Institution | null;
  members: Profile[];
  refetchMembers: (providedUrl?: string) => void;
}

const DashboardContext = createContext<DashboardContextProps | null>(null);

export const useDashboard = () => useContext(DashboardContext)!;

export function DashboardProvider(props: DashboardPageProps & ChildrenProps) {
  const {
    institutions: propsInstitutions,
    selectedInstitution: propsSelectedInstitution,
    children,
    members,
    refetchMembers,
  } = props;

  const { role } = useAuthenticatedAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !role) return;

    const lastItemInUrl = pathname.split('/').pop();
    const links = Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role));
    const matched =
      lastItemInUrl && links.find((link) => link?.href.endsWith(lastItemInUrl));

    setFilter(matched || LINK_DASHBOARD_GROUPS);
  }, [pathname, role]);

  const [filter, setFilter] = useState<ILink>(LINK_DASHBOARD_GROUPS);
  const [institutions, setInstitutions] =
    useState<Institution[]>(propsInstitutions);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(propsSelectedInstitution);
  const [detectedChanges, setDetectedChanges] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(
    selectedInstitution?.groups && selectedInstitution?.groups.length
      ? selectedInstitution.groups[0]
      : null
  );

  const { setUsers } = useMain();

  const { data: fetchedUsers, refetch: refetchUsers } =
    useNestBackendFetch<AuthUser[]>(`/auth`);

  useEffect(() => {
    if (fetchedUsers) setUsers(fetchedUsers);
  }, [fetchedUsers, setUsers]);

  const value: DashboardContextProps = {
    filter,
    setFilter,
    refetchUsers,
    institutions,
    setInstitutions,
    selectedInstitution,
    setSelectedInstitution,
    detectedChanges,
    setDetectedChanges,
    selectedGroup,
    setSelectedGroup,
    members,
    refetchMembers,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
