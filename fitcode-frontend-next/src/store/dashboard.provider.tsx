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
  DASHBOARD_VIEWS,
  LINK_DASHBOARD_GROUPS,
  LINK_DASHBOARD_TRAINING_PLAN,
} from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';
import { Training } from '@/core/training/type/training.type';

interface Props extends React.PropsWithChildren {
  institutionId: string;
  trainings: Training[];
}

export interface IDashboardContext {
  filter: ILink;
  setFilter: SetState<ILink>;
  institutions: Institution[];
  setInstitutions: SetState<Institution[]>;
  selectedInstitution: Institution | null;
  setSelectedInstitution: SetState<Institution | null>;
  trainings: Training[];
  setTrainings: SetState<Training[]>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
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
  const { children, institutionId, trainings: propsTrainings } = props;

  const { role, user } = useAuthenticatedAuth();
  const {
    users,
    setUsers,
    setProfiles,
    setGroups,
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

  const [trainings, setTrainings] = useState<Training[]>([]);

  useEffect(() => {
    setTrainings(propsTrainings);
  }, [propsTrainings]);

  // update filter based on url
  useEffect(() => {
    if (!pathname || !role) return;

    const lastItemInUrl = pathname.split('/').pop();
    const links = DASHBOARD_VIEWS(role);
    const matched =
      lastItemInUrl && links.find((link) => link?.href.endsWith(lastItemInUrl));

    setFilter(matched || LINK_DASHBOARD_TRAINING_PLAN);
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
  }, [selectedInstitution]);

  const value: IDashboardContext = {
    filter,
    setFilter,
    institutions,
    setInstitutions,
    selectedInstitution,
    setSelectedInstitution,
    trainings,
    setTrainings,
    detectedChanges,
    setDetectedChanges,
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
      };

      function mapper(group: Group): Group {
        if (group.id !== groupId) return group;
        return {
          ...group,
          name: input.name ?? group.name,
          ownerId: input.ownerId ?? group.ownerId,
        };
      }

      const apply = () => {
        // apply optimistic update
        setSelectedInstitution((prev) =>
          prev ? { ...prev, groups: prev.groups.map(mapper) } : prev
        );
      };

      const rollback = (snapshot: any) => {
        // rollback
        setSelectedInstitution(snapshot.institution);
        toast.error('Failed to update group name');
      };

      const action = () => GroupController.getInstance().update(groupId, input);

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
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

      const apply = () => {
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
      };

      const rollback = (snapshot: any, e: Error) => {
        console.error(e);
        setUsers(snapshot.users);
        setSelectedInstitution(snapshot.institution);
        toast.error('Failed to update user');
      };

      const action = async () => {
        const controller = AuthController.getInstance();

        if (input.displayName || input.photoURL) {
          await controller.updateUser(userId, {
            displayName: input.displayName,
            photoURL: input.photoURL,
          });
        }

        if (input.role) {
          await controller.updateCustomClaims(userId, {
            role: [input.role],
          });
        }
      };

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    deleteGroup: async (groupId: string) => {
      if (!selectedInstitution) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
      };

      const apply = () => {
        setSelectedInstitution((prev) =>
          prev
            ? {
                ...prev,
                groups: prev.groups.filter((group) => group.id !== groupId),
              }
            : prev
        );
      };

      const rollback = (snapshot: any) => {
        setSelectedInstitution(snapshot.institution);
        toast.error('Failed to delete group');
      };

      const action = () => GroupController.getInstance().delete(groupId);

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    addGroup: async (data: Group) => {
      if (!selectedInstitution) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
      };

      const apply = () => {
        setSelectedInstitution((prev) =>
          prev ? { ...prev, groups: [...prev.groups, data] } : prev
        );
      };

      const rollback = (snapshot: any) => {
        setSelectedInstitution(snapshot.institution);
        toast.error('Failed to add group');
      };

      const action = () => GroupController.getInstance().create(data);

      return await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    addGroupMember: async (user: AuthUser, groupId: string) => {
      const group = selectedInstitution?.groups?.find((g) => g.id === groupId);
      if (!selectedInstitution || !group) return;

      const prevState = {
        institution: structuredClone(selectedInstitution),
        group: structuredClone(group),
      };

      const apply = () => {
        const newGroup: Group = {
          ...group,
          members: group.members ? [...group.members, user] : [user],
          membersIds: group.membersIds
            ? [...group.membersIds, user.uid]
            : [user.uid],
        };

        setProfiles((prev) => [...prev, core.profile.userToProfile(user)]);
        setSelectedInstitution((prev) => ({
          ...prev!,
          groups: prev!.groups.map((g) =>
            g.id === newGroup.id ? newGroup : g
          ),
        }));
        setGroups((prev) =>
          prev.map((g) => (g.id === newGroup.id ? newGroup : g))
        );
      };

      const rollback = (snapshot: any) => {
        setSelectedInstitution(snapshot.institution);
        toast.error('Failed to add member to group');
      };

      const action = () =>
        GroupController.getInstance().addMember(group.id, {
          userId: user.uid,
        });

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
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

      const apply = () => {
        const newGroup: Group = {
          ...group,
          members: group.members?.filter((m) => m.uid !== userId),
          membersIds: group.membersIds?.filter((id) => id !== userId),
        };

        setProfiles((prev) => prev.filter((m) => m.uid !== userId));
        setSelectedInstitution((prev) => ({
          ...prev!,
          groups: prev!.groups.map((g) =>
            g.id === newGroup.id ? newGroup : g
          ),
        }));
        setGroups((prev) =>
          prev.map((g) => (g.id === newGroup.id ? newGroup : g))
        );
      };

      const rollback = (snapshot: any) => {
        setSelectedInstitution(snapshot.institution);
        toast.error('Failed to remove member from group');
      };

      const action = () =>
        GroupController.getInstance().removeMember(group.id, {
          userId,
        });

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
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
