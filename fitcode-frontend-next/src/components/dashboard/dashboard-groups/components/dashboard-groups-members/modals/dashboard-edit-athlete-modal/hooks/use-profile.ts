import { AuthUser } from '@/controller/auth/type/user.type';
import { Profile } from '@/controller/profile/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useEffect, useState } from 'react';

export type UseDashboardEditAthleteModalUseProfileReturnType = ReturnType<
  typeof useDashboardEditAthleteModalUseProfile
>;

export default function useDashboardEditAthleteModalUseProfile(
  userToEdit: AuthUser | null
) {
  const { members } = useDashboard();

  const [profileToEdit, setProfileToEdit] = useState<Profile | undefined>();
  const [isEditedProfile, setIsEditedProfile] = useState(false);
  const [isEditedUser, setIsEditedUser] = useState(false);

  useEffect(() => {
    if (!userToEdit) return;
    const profile = members.find((m) => m.uid === userToEdit.uid);
    setProfileToEdit(profile);
  }, [userToEdit]);

  return {
    profileToEdit,
    setProfileToEdit,
    isEditedProfile,
    setIsEditedProfile,
    isEditedUser,
    setIsEditedUser,
  };
}
