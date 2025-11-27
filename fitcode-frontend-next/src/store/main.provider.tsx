'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { withAuth } from './auth.provider';
import type { AuthProfileMerged, AuthUser } from '@/core/auth/type/user.type';
import { Controller } from '@/core/controller';
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
import type { Profile } from '@/core/profile/type/user.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
import { TrainingService } from '@/core/training/training.service';
import type {
  ActiveTraining,
  Training,
} from '@/core/training/type/training.type';
import type { TrainingProtocol } from '@/core/training/type/training-protocol.type';
import type { Fetch } from '@/lib/common/type/fetch.type';
import type { SetState } from '@/lib/common/type/state.type';
import { initFetch, settleState } from '@/lib/common/util/state.util';

export interface MainProviderProps extends React.PropsWithChildren {
  profile: AuthProfileMerged;
  globalExercisesRevision: number;
  institutions: Institution[];
  activeTraining: ActiveTraining | null;
  exerciseAiPrescriptions: ExerciseAiPrescription[];
  institution: InitInstitution;
}

export interface IMainContext extends MainProviderProps {
  users: AuthUser[];
  profiles: Profile[];
  exercises: Exercise[];
  groups: Group[];
  setProfile: SetState<AuthProfileMerged>;
  setProfiles: SetState<Profile[]>;
  setUsers: SetState<AuthUser[]>;
  setExercises: SetState<Exercise[]>;
  setGroups: SetState<Group[]>;
  setActiveTraining: SetState<ActiveTraining | null>;
  setExerciseAiPrescriptions: SetState<ExerciseAiPrescription[]>;
  wellness: WellnessZScore[];
  trainings: Fetch<Training[]>;
  protocols: Fetch<TrainingProtocol[]>;
  setProtocols: SetState<Fetch<TrainingProtocol[]>>;
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
  const { institution: _institution, children } = props;
  const institutionId = _institution.id;

  const [profile, setProfile] = useState(props.profile);
  const [institution, setInstitution] = useState(_institution);
  const [groups, setGroups] = useState<Group[]>(_institution.groups);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [trainings, setTrainings] = useState(initFetch<Training[]>([]));
  const [protocols, setProtocols] = useState(initFetch<TrainingProtocol[]>([]));
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [exerciseAiPrescriptions, setExerciseAiPrescriptions] = useState(
    props.exerciseAiPrescriptions
  );

  const [activeTraining, setActiveTraining] = useState<ActiveTraining | null>(
    () => TrainingService.mapActiveTraining(props.activeTraining, { exercises })
  );

  // map users on fetch
  useEffect(() => {
    setGroups(institution.groups.map((g) => core.group.mapMembers(g, users)));
    setInstitution((prev) => core.institution.mapUsers([prev], users)[0]);
  }, [users]);

  // load exercises (from cache or from server)
  useEffect(() => {
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

  // load other data
  useEffect(() => {
    async function fetchData() {
      setProtocols((prev) => ({ ...prev, loading: true }));
      setTrainings((prev) => ({ ...prev, loading: true }));

      const controller = Controller.getInstance();
      const [authProfiles, protocols, trainings] = await Promise.allSettled([
        controller.institution.findAllMembersByInstitution(institutionId),
        controller.institution.findAllProtocolsByInstitution(institutionId),
        controller.training.findAll({ institutionId }),
      ]);

      setProtocols(settleState(protocols, []));
      setTrainings(settleState(trainings, []));

      if (authProfiles.status === 'fulfilled') {
        const users: AuthUser[] = authProfiles.value.map((u) => ({
          uid: u.uid,
          email: u.email!,
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          customClaims: { role: [u.role || UserRole.ATHLETE] },
        }));

        const profiles: Profile[] = authProfiles.value.map((u) => ({
          uid: u.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          email: u.email!,
          photoURLBase64: u.photoURLBase64 || '',
          sport: u.sport,
          level: u.level,
          gender: u.gender,
          birthDate: u.birthDate || new Date(),
          wellness: u.wellness || [],
        }));

        setUsers(users);
        setProfiles(profiles);
      }
    }

    fetchData().then();
  }, []);

  const value: IMainContext = {
    profile,
    setProfile,
    profiles,
    setProfiles,
    users,
    setUsers,
    exercises,
    setExercises,
    groups,
    setGroups,
    setActiveTraining,
    exerciseAiPrescriptions,
    setExerciseAiPrescriptions,
    trainings,
    protocols,
    setProtocols,
    institutions: props.institutions,
    institution: props.institution,
    wellness: profiles.map((p) => p.wellness).flat(),
    globalExercisesRevision: props.globalExercisesRevision,
    activeTraining: TrainingService.mapActiveTraining(activeTraining, {
      exercises,
    }),
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
