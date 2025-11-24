'use client';

import { createContext, useContext, useState } from 'react';

import { useAuthenticatedAuth, withAuth } from './auth.provider';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { ExerciseAiPrescription } from '@/core/exercise-ai-prescriptions/type/exercise-detection-data';
import type { Group } from '@/core/institution/type/group.type';
import type {
  InitInstitution,
  Institution,
} from '@/core/institution/type/institution.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Profile } from '@/core/profile/type/user.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
import type {
  ActiveTraining,
  Training,
} from '@/core/training/type/training.type';
import type { TrainingProtocol } from '@/core/training/type/training-protocol.type';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';

export interface MainProviderProps extends React.PropsWithChildren {
  institutions: Institution[];
  activeTraining: ActiveTraining | null;
  exerciseAiPrescriptions: ExerciseAiPrescription[];
  institution: InitInstitution;
  wellness: WellnessZScore[];
  trainings: Training[];
  reports: TrainingReport[];
}

export interface IMainContext extends MainProviderProps {
  profile: Profile;
  users: AuthUser[];
  profiles: Profile[];
  exercises: Exercise[];
  groups: Group[];
  protocols: TrainingProtocol[];
  setProfile: SetStateNullable<Profile>;
  setProfiles: SetState<Profile[]>;
  setUsers: SetState<AuthUser[]>;
  setExercises: SetState<Exercise[]>;
  setGroups: SetState<Group[]>;
  setActiveTraining: SetState<ActiveTraining | null>;
  setExerciseAiPrescriptions: SetState<ExerciseAiPrescription[]>;
  setProtocols: SetState<TrainingProtocol[]>;
}

const MainContext = createContext<IMainContext | null>(null);

export const useMain = () => useContext(MainContext)!;

export const AthleteMainProvider = withAuth(MainProvider, [UserRole.ATHLETE]);
export const CoachMainProvider = withAuth(MainProvider, [
  UserRole.TRAINER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);

export default function MainProvider(props: MainProviderProps) {
  const { user } = useAuthenticatedAuth();
  const { children } = props;

  const [users, setUsers] = useState<AuthUser[]>(() =>
    props.institution.users.map((u) => ({
      uid: u.uid,
      email: u.email!,
      displayName: u.displayName || '',
      photoURL: u.photoURL || '',
      customClaims: { role: [u.role || UserRole.ATHLETE] },
    }))
  );

  const [profiles, setProfiles] = useState<Profile[]>(() =>
    props.institution.users.map((u) => ({
      uid: u.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: u.email!,
      weight: u.weight || 0,
      height: u.height || 0,
      photoURLBase64: u.photoURLBase64 || '',
      sport: u.sport,
      level: u.level,
      gender: u.gender,
      birthDate: u.birthDate || new Date(),
    }))
  );

  const [groups, setGroups] = useState<Group[]>(props.institution.groups);
  const [activeTraining, setActiveTraining] = useState<ActiveTraining | null>(
    props.activeTraining
  );

  const [exerciseAiPrescriptions, setExerciseAiPrescriptions] = useState<
    ExerciseAiPrescription[]
  >(props.exerciseAiPrescriptions);

  const [protocols, setProtocols] = useState<TrainingProtocol[]>(
    props.institution.protocols
  );

  const value: IMainContext = {
    profile: profiles.find((p) => p.uid === user?.uid)!,
    setProfile: ((profile?: Profile) => {
      if (!profile) return;
      setProfiles((prev) =>
        prev.map((p) => (p.uid === profile.uid ? profile! : p))
      );
    }) as SetStateNullable<Profile>,
    profiles,
    setProfiles,
    users,
    setUsers,
    exercises: [],
    setExercises: () => {},
    institutions: props.institutions,
    groups,
    setGroups,
    wellness: props.wellness,
    activeTraining,
    setActiveTraining,
    exerciseAiPrescriptions,
    setExerciseAiPrescriptions,
    protocols,
    setProtocols,
    institution: props.institution,
    trainings: props.trainings,
    reports: props.reports,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
