'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { core } from '@/core/core.service';
import type { User } from '@/core/user/type/user.type';
import { UserController } from '@/core/user/user.controller';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

interface IDashboardUserEditCtx {
  // getters
  hoveredUser: User | null;
  userToEdit: User | null;
  filteredUsers: User[];
  currentUsers: User[];
  // setters
  setUserToEdit: SetState<User | null>;
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

const DashboardUserEditContext = createContext<IDashboardUserEditCtx | null>(
  null
);

export const useDashboardUserEdit = () => useContext(DashboardUserEditContext)!;

export function DashboardUserEditProvider({
  children,
}: React.PropsWithChildren) {
  const { users, setUsers, setInstitution } = useMain();
  const { setSelectedGroups } = useDashboard();

  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditedUser, setIsEditedUser] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!userToEdit) return;

    const newUserToEdit =
      users.data.find((u) => u.uid === userToEdit.uid) || null;

    toggleUser(newUserToEdit);
  }, [users]);

  function onHoverUser(user: User | null) {
    setHoveredUser(user);
  }

  function toggleUser(user: User | null) {
    if (!user) {
      setIsEditedUser(false);
      setUserToEdit(null);
    } else {
      setUserToEdit(structuredClone({ ...user }));
    }
  }

  async function updateUser(options?: {
    force?: boolean;
    passedUser?: User | null;
  }) {
    const { force, passedUser } = options || {};
    const finalUserToEdit = passedUser || userToEdit;
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

      setSelectedGroups((prev) =>
        prev.map((g) => core.group.mapMembers(g, mappedUsers))
      );

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
      setUserToEdit(null);
    }
  }

  function onUserChange<K extends keyof User>(key: K, value: User[K]) {
    if (!userToEdit) return;
    const newUser: User = { ...userToEdit, [key]: value };
    setUserToEdit(newUser);
    setIsEditedUser(true);
  }

  const value: IDashboardUserEditCtx = {
    hoveredUser,
    userToEdit,
    filteredUsers,
    currentUsers,
    setUserToEdit,
    setFilteredUsers,
    setCurrentUsers,
    onHoverUser,
    toggleUser,
    onUserChange,
    updateUser,
  };

  return (
    <DashboardUserEditContext.Provider value={value}>
      {children}
    </DashboardUserEditContext.Provider>
  );
}
