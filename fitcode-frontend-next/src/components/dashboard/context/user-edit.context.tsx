'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser } from '@/core/auth/type/user.type';
import { BACKEND_API_BASE_URL } from '@/core/const/api.const';
import { ProfileController } from '@/core/profile/profile.controller';
import type { Profile } from '@/core/profile/type/user.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';

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
  const {
    filter,
    members,
    setMembers,
    setUsers,
    selectedInstitution,
    selectedGroup,
    refetchMembers,
    refetchUsers,
  } = useDashboard();

  const [hoveredUser, setHoveredUser] = useState<AuthUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<AuthUser | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<Profile | undefined>();
  const [isEditedProfile, setIsEditedProfile] = useState(false);
  const [isEditedUser, setIsEditedUser] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([]);
  const [currentUsers, setCurrentUsers] = useState<AuthUser[]>([]);

  /**
   * Update filtered users arrays when selected group changes
   */
  useEffect(() => {
    const groupUsers = selectedGroup?.members || [];
    setFilteredUsers(groupUsers);
    setCurrentUsers(groupUsers);
  }, [selectedGroup, filter]);

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
      const profile = members.find((m) => m.uid === user.uid);
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

      refetchUsers();
      refetchMembers(
        selectedInstitution
          ? `${BACKEND_API_BASE_URL}/institution/${selectedInstitution.id}/find/all`
          : undefined
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
    setMembers((prev) =>
      prev.map((member) =>
        member.uid === newProfile.uid ? newProfile : member
      )
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
