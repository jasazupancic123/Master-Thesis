'use client';

import { createContext, useContext, useState } from 'react';
import { toast } from 'react-hot-toast';

import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser } from '@/core/auth/type/user.type';
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
  updateUserProfile: () => Promise<void>;
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
  const { profiles, setProfiles } = useMain();
  const { setUsers, setSelectedInstitution } = useDashboard();

  const [hoveredUser, setHoveredUser] = useState<AuthUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<AuthUser | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<Profile | undefined>();
  const [isEditedProfile, setIsEditedProfile] = useState(false);
  const [isEditedUser, setIsEditedUser] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([]);
  const [currentUsers, setCurrentUsers] = useState<AuthUser[]>([]);

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
      setUserToEdit(user);
      setProfileToEdit(profile);
    }
  }

  async function updateUserProfile() {
    if ((!isEditedProfile || !profileToEdit) && (!userToEdit || !isEditedUser))
      return;

    try {
      if (profileToEdit && isEditedProfile)
        await ProfileController.getInstance().update({
          photoURLBase64: profileToEdit.photoURLBase64,
          level: profileToEdit.level,
          sport: profileToEdit.sport,
          birthDate: profileToEdit.birthDate,
          gender: profileToEdit.gender,
          userId: profileToEdit.uid,
        });

      if (userToEdit && isEditedUser)
        await AuthController.getInstance().updateUser(userToEdit.uid, {
          displayName: userToEdit.displayName,
          photoURL: userToEdit.photoURL,
        });

      function mapUsers(users?: AuthUser[]) {
        if (!users) return [];
        return users.map((user) =>
          user.uid === userToEdit?.uid ? userToEdit : user
        );
      }

      function mapProfiles(profiles?: Profile[]) {
        if (!profiles) return [];
        return profiles.map((p) =>
          p.uid === profileToEdit?.uid ? profileToEdit : p
        );
      }

      setUsers(mapUsers);
      setProfiles(mapProfiles);
      setFilteredUsers(mapUsers);
      setCurrentUsers(mapUsers);

      setSelectedInstitution((prev) =>
        !prev
          ? null
          : {
              ...prev,
              athletes: mapUsers(prev.athletes),
              trainers: mapUsers(prev.trainers),
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
