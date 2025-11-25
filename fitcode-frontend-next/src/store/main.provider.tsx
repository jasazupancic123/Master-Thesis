'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthenticatedAuth, withAuth } from './auth.provider';
import type { AuthUser } from '@/core/auth/type/user.type';
import { core } from '@/core/core.service';
import { ExerciseController } from '@/core/exercise/exercise.controller';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { ExerciseAiPrescription } from '@/core/exercise-ai-prescriptions/type/exercise-detection-data';
import type { Group } from '@/core/institution/type/group.type';
import type {
  InitInstitution,
  Institution,
} from '@/core/institution/type/institution.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { ProfileController } from '@/core/profile/profile.controller';
import type { Profile } from '@/core/profile/type/user.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
import { TrainingService } from '@/core/training/training.service';
import type {
  ActiveTraining,
  Training,
} from '@/core/training/type/training.type';
import type { TrainingProtocol } from '@/core/training/type/training-protocol.type';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';

export interface MainProviderProps extends React.PropsWithChildren {
  profile: Profile;
  globalExercisesRevision: number;
  institutions: Institution[];
  activeTraining: ActiveTraining | null;
  exerciseAiPrescriptions: ExerciseAiPrescription[];
  institution: InitInstitution;
  trainings: Training[];
  reports: TrainingReport[];
}

export interface IMainContext extends MainProviderProps {
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
  wellness: WellnessZScore[];
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
  const { user, role } = useAuthenticatedAuth();
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

  const [exerciseAiPrescriptions, setExerciseAiPrescriptions] = useState<
    ExerciseAiPrescription[]
  >(props.exerciseAiPrescriptions);

  const [protocols, setProtocols] = useState<TrainingProtocol[]>(
    props.institution.protocols
  );

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [wellness, setWellness] = useState<WellnessZScore[]>([]);
  const [activeTraining, setActiveTraining] = useState<ActiveTraining | null>(
    () => TrainingService.mapActiveTraining(props.activeTraining, { exercises })
  );

  useEffect(() => {
    const institutionId = props.institution.id;
    if (!institutionId) return;

    async function fetchExercises() {
      const serverGlobalRevision = props.globalExercisesRevision;
      const serverInstitutionRevision =
        props.institution.exerciseRevisions || 0;

      try {
        const cachedExercises = await core.exercise.getCached(institutionId);
        if (cachedExercises) setExercises(cachedExercises);

        const cachedGlobalRevision =
          await core.exercise.getCachedGlobalRevision();
        const cachedInstitutionRevision =
          await core.exercise.getCachedInstitutionRevision(institutionId);

        if (
          cachedGlobalRevision === serverGlobalRevision &&
          cachedInstitutionRevision === serverInstitutionRevision
        ) {
          console.log('Exercises are up to date, no need to fetch');
          return;
        }

        console.log('Fetching updated exercises from server');

        const exercises =
          await ExerciseController.getInstance().findAll(institutionId);

        setExercises(exercises);

        await Promise.all([
          core.exercise.saveToCache(institutionId, exercises),
          core.exercise.saveGlobalRevisionToCache(serverGlobalRevision),
          core.exercise.saveInstitutionRevisionToCache(
            institutionId,
            serverInstitutionRevision
          ),
        ]);
      } catch (e) {
        console.error('Failed to fetch exercises', e);
        toast.error('Failed to fetch exercises');
      }
    }

    fetchExercises().then();
  }, []);

  useEffect(() => {
    const institutionId = props.institution.id;
    if (!institutionId) return;

    // only for manager and trainers
    if (role === UserRole.ATHLETE || role === UserRole.ADMIN) return;

    async function fetchWellness() {
      try {
        const wellness =
          await ProfileController.getInstance().getWellnessByInstitution(
            institutionId
          );

        setWellness(wellness);
      } catch (e) {
        console.error('Failed to fetch wellness', e);
        toast.error('Failed to fetch wellness');
      }
    }

    fetchWellness().then();
  }, []);

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
    exercises,
    setExercises,
    groups,
    setGroups,
    activeTraining: TrainingService.mapActiveTraining(activeTraining, {
      exercises,
    }),
    setActiveTraining,
    exerciseAiPrescriptions,
    setExerciseAiPrescriptions,
    protocols,
    setProtocols,
    institutions: props.institutions,
    institution: props.institution,
    wellness,
    trainings: props.trainings.map((t) =>
      TrainingService.mapData(t, { exercises })
    ),
    reports: props.reports.map((r) =>
      TrainingService.mapReport(r, {
        institutions: props.institutions,
        groups: props.institution.groups,
      })
    ),
    globalExercisesRevision: props.globalExercisesRevision,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
