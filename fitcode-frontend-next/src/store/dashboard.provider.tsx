'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useMain } from './main.provider';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import {
  LINK_DASHBOARD_HOME,
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
} from '@/common/constant/navigation.constant';
import { useFetch } from '@/common/hooks/use-fetch.hook';
import type { ILink } from '@/common/type/link.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { User, UserEntity } from '@/controller/user/type/user.type';

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
  members: UserEntity[];
  refetchMembers: (providedUrl?: string) => void;
}

export interface DashboardPageProps {
  institutions: Institution[];
  selectedInstitution: Institution | null;
  members: UserEntity[];
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

  const { profile } = useMain();

  const roles = profile.customClaims.role || [];

  let currentFilter = LINK_DASHBOARD_HOME;
  const url = new URL(window.location.href);
  const lastItemInUrl = url.pathname.split('/').pop();
  Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(roles)).map((link) => {
    if (lastItemInUrl && link?.href.endsWith(lastItemInUrl)) {
      currentFilter = link;
    }
  });

  const [filter, setFilter] = useState<ILink>(currentFilter);
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

  const { data: fetchedUsers, refetch: refetchUsers } = useFetch<User[]>(
    `${BACKEND_API_BASE_URL}/user`,
    { method: 'GET' }
  );

  useEffect(() => {
    if (fetchedUsers) {
      setUsers(fetchedUsers);
    }
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
