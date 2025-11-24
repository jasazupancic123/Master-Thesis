'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser } from '@/core/auth/type/user.type';
import { core } from '@/core/core.service';
import { ProfileController } from '@/core/profile/profile.controller';
import type { Profile } from '@/core/profile/type/user.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

interface IDashboardUserEditCtx {
  // getters
  hoveredUser: AuthUser | null;
  userToEdit: AuthUser | null;
  profileToEdit: Profile | undefined;
  filteredUsers: AuthUser[];
  currentUsers: AuthUser[];
  // setters
  setUserToEdit: SetState<AuthUser | null>;
  setFilteredUsers: SetState<AuthUser[]>;
  setCurrentUsers: SetState<AuthUser[]>;
  onHoverUser: (user: AuthUser | null) => void;
  toggleUser: (user: AuthUser | null) => void;
  updateUserProfile: (options?: {
    force?: boolean;
    passedUser?: AuthUser | null;
    passedProfile?: Profile | undefined;
  }) => Promise<void>;
  onProfileChange: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  onUserChange: <K extends keyof AuthUser>(key: K, value: AuthUser[K]) => void;
}

const DashboardUserEditContext = createContext<IDashboardUserEditCtx | null>(
  null
);

export const useDashboardUserEdit = () => useContext(DashboardUserEditContext)!;

export function DashboardUserEditProvider({
  children,
}: React.PropsWithChildren) {
  const { profiles, setProfiles, users, setUsers, setGroups } = useMain();
  const { setSelectedInstitution } = useDashboard();

  const [hoveredUser, setHoveredUser] = useState<AuthUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<AuthUser | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<Profile | undefined>();
  const [isEditedProfile, setIsEditedProfile] = useState(false);
  const [isEditedUser, setIsEditedUser] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([]);
  const [currentUsers, setCurrentUsers] = useState<AuthUser[]>([]);

  useEffect(() => {
    if (!userToEdit) return;

    const newUserToEdit = users.find((u) => u.uid === userToEdit.uid) || null;
    setUserToEdit(newUserToEdit);
  }, [users]);

  function onHoverUser(user: AuthUser | null) {
    setHoveredUser(user);
  }

  function toggleUser(user: AuthUser | null) {
    if (!user) {
      setIsEditedProfile(false);
      setIsEditedUser(false);
      setUserToEdit(null);
      setProfileToEdit(undefined);
    } else {
      const profile = profiles.find((m) => m.uid === user.uid);
      setUserToEdit(structuredClone(user));
      setProfileToEdit(profile);
    }
  }

  async function updateUserProfile(options?: {
    force?: boolean;
    passedUser?: AuthUser | null;
    passedProfile?: Profile | undefined;
  }) {
    const { force, passedUser, passedProfile } = options || {};

    const finalUserToEdit = passedUser || userToEdit;
    const finalProfileToEdit = passedProfile || profileToEdit;

    if (
      !force &&
      (!finalProfileToEdit || !isEditedProfile) &&
      (!finalUserToEdit || !isEditedUser)
    )
      return;

    try {
      if (finalProfileToEdit && (isEditedProfile || force)) {
        await ProfileController.getInstance().update({
          photoURLBase64: finalProfileToEdit.photoURLBase64,
          level: finalProfileToEdit.level,
          sport: finalProfileToEdit.sport,
          birthDate: finalProfileToEdit.birthDate,
          gender: finalProfileToEdit.gender,
          userId: finalProfileToEdit.uid,
        });
      }

      if (finalUserToEdit && (isEditedUser || force)) {
        await AuthController.getInstance().updateUser(finalUserToEdit.uid, {
          displayName: finalUserToEdit.displayName,
          photoURL: finalUserToEdit.photoURL,
        });
      }

      function mapUsers(users?: AuthUser[]) {
        if (!users) return [];
        return users.map((user) =>
          user.uid === finalUserToEdit?.uid ? finalUserToEdit : user
        );
      }

      function mapProfiles(profiles?: Profile[]) {
        if (!profiles) return [];
        return profiles.map((p) =>
          p.uid === finalProfileToEdit?.uid ? finalProfileToEdit : p
        );
      }

      const mappedUsers = mapUsers(users);
      setUsers(mapUsers);
      setProfiles(mapProfiles);
      setFilteredUsers(mapUsers);
      setCurrentUsers(mapUsers);

      setGroups((prev) =>
        prev.map((g) => core.group.mapMembers(g, mappedUsers))
      );

      setSelectedInstitution((prev) =>
        !prev
          ? null
          : {
              ...prev,
              athletes: mapUsers(prev.athletes),
              trainers: mapUsers(prev.trainers),
              groups: (prev.groups || []).map((group) =>
                core.group.mapMembers(group, mappedUsers)
              ),
            }
      );

      toast.success('Successfully updated user profile');
    } catch (e) {
      console.error('Error updating user profile:', e);
      toast.error('Failed to update user profile');
    } finally {
      setIsEditedProfile(false);
      setUserToEdit(null);
    }
  }

  function onProfileChange<K extends keyof Profile>(key: K, value: Profile[K]) {
    if (!profileToEdit) return;
    const newProfile: Profile = { ...profileToEdit!, [key]: value };

    setProfileToEdit(newProfile);
    setIsEditedProfile(true);
    setProfiles((prev) =>
      prev.map((p) => (p.uid === newProfile.uid ? newProfile : p))
    );
  }

  function onUserChange<K extends keyof AuthUser>(key: K, value: AuthUser[K]) {
    if (!userToEdit) return;
    const newUser: AuthUser = { ...userToEdit, [key]: value };

    setUserToEdit(newUser);
    setIsEditedUser(true);
    setFilteredUsers((prev) =>
      prev.map((user) => (user.uid === newUser.uid ? newUser : user))
    );
    setUsers((prev) =>
      prev.map((user) => (user.uid === newUser.uid ? newUser : user))
    );
  }

  const value: IDashboardUserEditCtx = {
    hoveredUser,
    userToEdit,
    profileToEdit,
    filteredUsers,
    currentUsers,
    setUserToEdit,
    setFilteredUsers,
    setCurrentUsers,
    onHoverUser,
    toggleUser,
    updateUserProfile,
    onProfileChange,
    onUserChange,
  };

  return (
    <DashboardUserEditContext.Provider value={value}>
      {children}
    </DashboardUserEditContext.Provider>
  );
}
