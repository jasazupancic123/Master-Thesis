'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { core } from '@/core/core.service';
import type { User } from '@/core/user/type/user.type';
import { UserController } from '@/core/user/user.controller';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';

interface IDashboardUserActionsCtx {
  // getters
  hoveredUser: User | null;
  activeUser: User | null;
  filteredUsers: User[];
  currentUsers: User[];
  // setters
  setActiveUser: SetState<User | null>;
  setFilteredUsers: SetState<User[]>;
  setCurrentUsers: SetState<User[]>;
  onHoverUser: (user: User | null) => void;
  toggleUser: (user: User | null) => void;
  onUserChange: <K extends keyof User>(key: K, value: User[K]) => void;
  updateUser: (options?: {
    force?: boolean;
    passedUser?: User | null;
  }) => Promise<void>;
}

const DashboardUserActionsContext =
  createContext<IDashboardUserActionsCtx | null>(null);

export const useDashboardUserActions = () =>
  useContext(DashboardUserActionsContext)!;

export function DashboardUserActionsProvider({
  children,
}: React.PropsWithChildren) {
  const { users, setUsers, setInstitution } = useMain();

  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isEditedUser, setIsEditedUser] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!activeUser) return;

    const newUserToEdit =
      users.data.find((u) => u.uid === activeUser.uid) || null;

    toggleUser(newUserToEdit);
  }, [users]);

  function onHoverUser(user: User | null) {
    setHoveredUser(user);
  }

  function toggleUser(user: User | null) {
    if (!user) {
      setIsEditedUser(false);
      setActiveUser(null);
    } else {
      setActiveUser(structuredClone({ ...user }));
    }
  }

  async function updateUser(options?: {
    force?: boolean;
    passedUser?: User | null;
  }) {
    const { force, passedUser } = options || {};
    const finalUserToEdit = passedUser || activeUser;
    if (!force && (!finalUserToEdit || !isEditedUser)) return;

    try {
      if (finalUserToEdit && (isEditedUser || force)) {
        await UserController.getInstance().update(finalUserToEdit.uid, {
          displayName: finalUserToEdit.displayName,
          photoURL: finalUserToEdit.photoURL,
          photoURLBase64: finalUserToEdit.photoURLBase64,
          level: finalUserToEdit.level,
          sport: finalUserToEdit.sport,
          birthDate: finalUserToEdit.birthDate,
          gender: finalUserToEdit.gender,
        });
      }

      function mapUsers(users?: User[]) {
        if (!users) return [];
        return users.map((user) =>
          user.uid === finalUserToEdit?.uid ? finalUserToEdit : user
        );
      }

      const mappedUsers = mapUsers(users.data);
      setUsers((prev) => ({ ...prev, data: mappedUsers }));
      setFilteredUsers(mapUsers);
      setCurrentUsers(mapUsers);

      setInstitution((prev) => ({
        ...prev,
        athletes: mapUsers(prev.athletes),
        trainers: mapUsers(prev.trainers),
        groups: (prev.groups || []).map((group) =>
          core.group.mapMembers(group, mappedUsers)
        ),
      }));

      toast.success('Successfully updated user profile');
    } catch (e) {
      console.error('Error updating user profile:', e);
      toast.error('Failed to update user profile');
    } finally {
      setActiveUser(null);
    }
  }

  function onUserChange<K extends keyof User>(key: K, value: User[K]) {
    if (!activeUser) return;
    const newUser: User = { ...activeUser, [key]: value };
    setActiveUser(newUser);
    setIsEditedUser(true);
  }

  const value: IDashboardUserActionsCtx = {
    hoveredUser,
    activeUser,
    filteredUsers,
    currentUsers,
    setActiveUser,
    setFilteredUsers,
    setCurrentUsers,
    onHoverUser,
    toggleUser,
    onUserChange,
    updateUser,
  };

  return (
    <DashboardUserActionsContext.Provider value={value}>
      {children}
    </DashboardUserActionsContext.Provider>
  );
}
