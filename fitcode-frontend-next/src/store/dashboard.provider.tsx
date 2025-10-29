'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser, UpdateUser } from '@/core/auth/type/user.type';
import { core } from '@/core/core.service';
import { GroupController } from '@/core/group/group.controller';
import type { Group, UpdateGroup } from '@/core/group/type/group.type';
import { InstitutionController } from '@/core/institution/institution.controller';
import type {
  Institution,
  UpdateInstitution,
} from '@/core/institution/type/institution.type';
import type { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import {
  LINK_DASHBOARD_GROUPS,
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
} from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';

interface Props extends React.PropsWithChildren {
  institutionId: string;
}

export interface IDashboardContext {
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
  setUsers: SetState<AuthUser[]>;
  updateInstitution: (
    institutionId: string,
    input: UpdateInstitution
  ) => Promise<void>;
  updateGroup: (groupId: string, input: UpdateGroup) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addGroup: (data: Group) => Promise<Group | undefined>;
  addGroupMember: (user: AuthUser, groupId: string) => Promise<void>;
  removeGroupMember: (userId: string, groupId: string) => Promise<void>;
  updateUser: (
    userId: string,
    input: UpdateUser & { role?: UserRole }
  ) => Promise<void>;
}

const DashboardContext = createContext<IDashboardContext | null>(null);

export const useDashboard = () => useContext(DashboardContext)!;

export function DashboardProvider(props: Props) {
  const { children, institutionId } = props;

  const { role, user } = useAuthenticatedAuth();
  const {
    users,
    setUsers,
    setProfiles,
    institutions: propsInstitutions,
  } = useMain();
  const pathname = usePathname();
  const { groups } = useMain();

  const [filter, setFilter] = useState<ILink>(LINK_DASHBOARD_GROUPS);
  const [detectedChanges, setDetectedChanges] = useState(false);

  const [institutions, setInstitutions] = useState<Institution[]>(() =>
    core.institution.mapUsers(propsInstitutions || [], users)
  );

  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(() => {
      const institution = propsInstitutions.find((i) => i.id === institutionId);
      if (!institution) return null;

      core.institution.mapUsers([institution], users);
      institution.groups = groups.filter(
        (g) => g.institutionId === institution.id
      );

      for (const group of institution.groups)
        core.group.mapMembers(group, users);

      return institution;
    });

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(
    selectedInstitution?.groups?.length ? selectedInstitution.groups[0] : null
  );

  // update filter based on url
  useEffect(() => {
    if (!pathname || !role) return;

    const lastItemInUrl = pathname.split('/').pop();
    const links = Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role));
    const matched =
      lastItemInUrl && links.find((link) => link?.href.endsWith(lastItemInUrl));

    setFilter(matched || LINK_DASHBOARD_GROUPS);
  }, [pathname, role]);

  // reset selected group when institution changes
  useEffect(() => {
    if (!selectedInstitution || selectedInstitution.groups) return;
    const filtered = groups.filter(
      (g) => g.institutionId === selectedInstitution.id
    );

    for (const group of filtered) core.group.mapMembers(group, users);

    setSelectedInstitution(
      (prev) => ({ ...prev, groups: filtered }) as Institution
    );

    if (filtered.length) setSelectedGroup(filtered[0]);
  }, [selectedInstitution]);

  const value: IDashboardContext = {
    filter,
    setFilter,
    institutions,
    setInstitutions,
    selectedInstitution,
    setSelectedInstitution,
    detectedChanges,
    setDetectedChanges,
    selectedGroup,
    setSelectedGroup,
    setUsers,
    updateInstitution: async (institutionId, input) => {
      const prevState = {
        institution: structuredClone(selectedInstitution),
        institutions: structuredClone(institutions),
      };

      function mapper(inst: Institution): Institution {
        if (inst.id !== institutionId) return inst;
        return {
          ...inst,
          name: input.name ?? inst.name,
          imageUrl: input.imageUrl ?? inst.imageUrl,
        };
      }

      await lib.common.generic.optimisticUpdate(
        () => {
          setInstitutions((prev) => prev.map(mapper));
          if (institutionId === selectedInstitution?.id)
            setSelectedInstitution((prev) => (prev ? mapper(prev) : prev));
        },
        (snapshot) => {
          setSelectedInstitution(snapshot.institution);
          setInstitutions(snapshot.institutions);
          toast.error('Failed to update institution name');
        },
        () => InstitutionController.getInstance().update(institutionId, input),
        prevState
      );
    },
    updateGroup: async (groupId: string, input: UpdateGroup) => {
      if (!selectedInstitution) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
        group: selectedGroup ? { ...selectedGroup } : null,
      };

      function mapper(group: Group): Group {
        if (group.id !== groupId) return group;
        return {
          ...group,
          name: input.name ?? group.name,
          ownerId: input.ownerId ?? group.ownerId,
        };
      }

      await lib.common.generic.optimisticUpdate(
        () => {
          // apply optimistic update
          setSelectedInstitution((prev) =>
            prev ? { ...prev, groups: prev.groups.map(mapper) } : prev
          );

          if (groupId === selectedGroup?.id)
            setSelectedGroup((prev) => (prev ? mapper(prev) : prev));
        },
        (snapshot) => {
          // rollback
          setSelectedInstitution(snapshot.institution);
          setSelectedGroup(snapshot.group);
          toast.error('Failed to update group name');
        },
        // perform the actual update
        () => GroupController.getInstance().update(groupId, input),
        prevState // snapshot for rollback
      );
    },
    updateUser: async (userId, input) => {
      if (!selectedInstitution || !users) return;
      if (userId === user?.uid) {
        toast.error('To update your profile, please use the profile page');
        return;
      }

      const prevState = {
        users: structuredClone(users),
        institution: structuredClone(selectedInstitution),
        selectedGroup: selectedGroup ? { ...selectedGroup } : null,
      };

      function mapper(user: AuthUser): AuthUser {
        if (user.uid !== userId) return user;
        return {
          ...user,
          displayName: input.displayName ?? user.displayName,
          photoURL: input.photoURL ?? user.photoURL,
          ...(input.role
            ? { customClaims: { ...user.customClaims, role: [input.role] } }
            : {}),
        };
      }

      await lib.common.generic.optimisticUpdate(
        () => {
          setUsers((prev) => prev.map(mapper));
          setSelectedInstitution((prev) =>
            prev
              ? {
                  ...prev,
                  athletes: prev.athletes.map(mapper),
                  trainers: prev.trainers.map(mapper),
                  owner: mapper(prev.owner),
                }
              : prev
          );

          if (selectedGroup?.members?.find((m) => m.uid === userId))
            setSelectedGroup((prev) =>
              prev
                ? { ...prev, members: prev?.members?.map(mapper) ?? [] }
                : prev
            );
        },
        (snapshot) => {
          setUsers(snapshot.users);
          setSelectedInstitution(snapshot.institution);
          setSelectedGroup(snapshot.selectedGroup);
          toast.error('Failed to update user');
        },
        async () => {
          const controller = AuthController.getInstance();

          if (input.displayName || input.photoURL)
            await controller.updateUser(userId, {
              displayName: input.displayName,
              photoURL: input.photoURL,
            });

          if (input.role)
            await controller.updateCustomClaims(userId, { role: [input.role] });
        },
        prevState
      );
    },
    deleteGroup: async (groupId: string) => {
      if (!selectedInstitution) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
        group: selectedGroup ? { ...selectedGroup } : null,
      };

      await lib.common.generic.optimisticUpdate(
        () => {
          setSelectedInstitution((prev) =>
            prev
              ? {
                  ...prev,
                  groups: prev.groups.filter((group) => group.id !== groupId),
                }
              : prev
          );

          if (groupId === selectedGroup?.id) setSelectedGroup(null);
        },
        (snapshot) => {
          setSelectedInstitution(snapshot.institution);
          setSelectedGroup(snapshot.group);
          toast.error('Failed to delete group');
        },
        () => GroupController.getInstance().delete(groupId),
        prevState
      );
    },
    addGroup: async (data: Group) => {
      if (!selectedInstitution) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
        group: selectedGroup ? { ...selectedGroup } : null,
      };

      return await lib.common.generic.optimisticUpdate(
        () => {
          setSelectedGroup(data);
          setSelectedInstitution((prev) =>
            prev ? { ...prev, groups: [...prev.groups, data] } : prev
          );
        },
        (snapshot) => {
          setSelectedInstitution(snapshot.institution);
          setSelectedGroup(snapshot.group);
          toast.error('Failed to add group');
        },
        () => GroupController.getInstance().create(data),
        prevState,
        (created) => {
          // post action on success - set the new id from backend
          if (!created) return;
          setSelectedInstitution((prev) =>
            prev
              ? {
                  ...prev,
                  groups: prev.groups.map((r) =>
                    r.id === data.id ? created : r
                  ),
                }
              : prev
          );

          setSelectedGroup(created);
        }
      );
    },
    addGroupMember: async (user: AuthUser, groupId: string) => {
      const group = selectedInstitution?.groups?.find((g) => g.id === groupId);
      if (!selectedInstitution || !group) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
        group: structuredClone(group),
      };

      await lib.common.generic.optimisticUpdate(
        () => {
          const newGroup: Group = {
            ...group,
            members: group.members ? [...group.members, user] : [user],
            membersIds: group.membersIds
              ? [...group.membersIds, user.uid]
              : [user.uid],
          };

          setProfiles((prev) => [...prev, core.profile.userToProfile(user)]);
          if (selectedGroup?.id === group.id) setSelectedGroup(newGroup);
          setSelectedInstitution((prev) => ({
            ...prev!,
            groups: prev!.groups.map((g) =>
              g.id === newGroup.id ? newGroup : g
            ),
          }));
        },
        (snapshot) => {
          setSelectedInstitution(snapshot.institution);
          if (selectedGroup?.id === group.id) setSelectedGroup(snapshot.group);
          toast.error('Failed to add member to group');
        },
        () =>
          GroupController.getInstance().addMember(group.id, {
            userId: user.uid,
          }),
        prevState
      );
    },
    removeGroupMember: async (userId: string, groupId: string) => {
      const group = selectedInstitution?.groups?.find((g) => g.id === groupId);
      if (!selectedInstitution || !group) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
        group: structuredClone(group),
      };

      await lib.common.generic.optimisticUpdate(
        () => {
          const newGroup: Group = {
            ...group,
            members: group.members?.filter((m) => m.uid !== userId),
            membersIds: group.membersIds?.filter((id) => id !== userId),
          };

          setProfiles((prev) => prev.filter((m) => m.uid !== userId));
          if (selectedGroup?.id === group.id) setSelectedGroup(newGroup);
          setSelectedInstitution((prev) => ({
            ...prev!,
            groups: prev!.groups.map((g) =>
              g.id === newGroup.id ? newGroup : g
            ),
          }));
        },
        (snapshot) => {
          setSelectedInstitution(snapshot.institution);
          if (selectedGroup?.id === group.id) setSelectedGroup(snapshot.group);
          toast.error('Failed to remove member from group');
        },
        () =>
          GroupController.getInstance().removeMember(group.id, {
            userId,
          }),
        prevState
      );
    },
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
