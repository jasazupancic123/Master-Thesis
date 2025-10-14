import type { UseDashboardEditAthleteModalUseProfileReturnType } from '../hooks/use-profile';
import type { SetState } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Profile } from '@/controller/profile/type/user.type';

export function handleChangeProfile<K extends keyof Profile>(
  input: {
    key: K;
    value: Profile[K];
    userToEdit: AuthUser | null;
  },
  context: { useProfile: UseDashboardEditAthleteModalUseProfileReturnType }
) {
  const { key, value, userToEdit } = input;

  const { useProfile } = context;

  const { profileToEdit, setProfileToEdit, setIsEditedProfile } = useProfile;

  if (!userToEdit) return;
  const newProfile = { ...profileToEdit, [key]: value };
  setProfileToEdit(newProfile as Profile);
  setIsEditedProfile(true);
}

export function handleChangeUser<K extends keyof AuthUser>(
  input: {
    key: K;
    value: AuthUser[K];
    userToEdit: AuthUser | null;
    setUserToEdit: SetState<AuthUser | null>;
    setFilteredUsers: SetState<AuthUser[]>;
  },
  context: { useProfile: UseDashboardEditAthleteModalUseProfileReturnType }
) {
  const { key, value, userToEdit, setUserToEdit, setFilteredUsers } = input;

  const { useProfile } = context;

  const { setIsEditedUser } = useProfile;

  if (!userToEdit) return;

  const newUser = { ...userToEdit, [key]: value };

  setUserToEdit(newUser);
  setIsEditedUser(true);
  setFilteredUsers((prev) =>
    prev.map((user) => (user.uid === newUser.uid ? newUser : user))
  );
}
