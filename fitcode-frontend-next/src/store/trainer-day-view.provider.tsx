import { isSameDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useMain } from './main.provider';
import { useScreenSize } from './screen-size.provider';
import type {
  GroupContextProps,
  TrainerDayViewContextProps,
} from '@/app/(trainer)/groups/[group_id]/props';
import { FirebaseFirestoreUtil } from '@/common/firebase/firebase-firestore.util';
import { CommonService } from '@/common/service/common.service';
import type { Day } from '@/common/service/util/date.util';
import type { Pagination } from '@/common/type/paginate.type';
import type { ChildrenProps } from '@/common/type/props.type';
import { handleApiRequest } from '@/common/type/state.type';
import { firestoreSerialize } from '@/common/util/firebase.util';
import { optimisticUpdate } from '@/common/util/optimistic-update';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { Controller } from '@/controller/controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Profile } from '@/controller/profile/type/user.type';
import type { WellnessZScore } from '@/controller/profile/type/wellness.type';
import { TrainingController } from '@/controller/training/training.controller';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import {
  type UserProgress,
  WorkloadService,
} from '@/controller/training/workload.service';

const commonService = CommonService.instance;
const firestore = FirebaseFirestoreUtil.Instance;

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayViewContext = () =>
  useContext(TrainerDayViewContext)!;

export function TrainerDayViewProvider(
  props: GroupContextProps & ChildrenProps
) {
  const { children, cycle, dateFrom, dateTo, group, trainings, setTrainings } =
    props;

  const router = useRouter();
  const screenSize = useScreenSize();
  const { components, exercises } = useMain();
  const controller = Controller.getInstance();

  // filtering selected component exercises
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: screenSize.isUltraSmall ? 3 : screenSize.isMobile ? 6 : 10,
    pages: 1,
    total: 0,
  });

  const [day, setDay] = useState<Day>(commonService.date.getToday());

  // check if it's after 12:00, then set to PM, else AM
  const [selectedPeriod, setSelectedPeriod] = useState<
    { key: Date; value: 'AM' | 'PM' } | undefined
  >(undefined);

  const [training, setTraining] = useState<Training | undefined>();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [component, setComponent] = useState<TrainingComponent | undefined>();
  const [supersets, setSupersets] = useState<Superset[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);

  const [wellness, setWellness] = useState<WellnessZScore[]>([]);

  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >([]);
  const [selectedAthlete, setSelectedAthlete] = useState<
    AuthUser | undefined
  >();
  const [selectedSubgroup, setSelectedSubgroup] = useState<Subgroup | null>(
    null
  );

  const [
    selectedAthleteCompletedWorkloads,
    setSelectedAthleteCompletedWorkloads,
  ] = useState<Workload[]>([]);

  const isSettingAthleteWorkloads = useRef(false);
  const previousSelectedAthlete = useRef<AuthUser | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSubgroup) setSupersets(selectedSubgroup.supersets);
    else if (component) {
      setSupersets(component.supersets);
    } else setSupersets([]);
  }, [selectedSubgroup, component]);

  useEffect(() => {
    if (selectedAthlete) {
      previousSelectedAthlete.current = selectedAthlete;
    }
  }, [selectedAthlete]);

  /**
   * Group members
   */
  useEffect(() => {
    async function fetchMembers() {
      handleApiRequest(
        router,
        () => controller.institution.findAthletes(group.institutionId),
        (members) => setMembers(members),
        undefined
      );
    }

    async function fetchWellness() {
      handleApiRequest(
        router,
        () => controller.profile.getWellnessByInstitution(group.institutionId),
        (wellness) => setWellness(wellness),
        undefined
      );
    }

    fetchMembers().then();
    fetchWellness().then();
  }, [group.institutionId]);

  /**
   * Reset selected training and its children on certain changes
   */
  useEffect(() => {
    // setSelectedSubgroup(null);
    setSelectedAthlete(undefined);
    setSelectedExercises([]);
  }, [cycle, dateFrom, dateTo]);

  /**
   * Filter exercises
   */
  useEffect(() => {
    if (!component) return;

    ExerciseService.paginate(
      {
        componentIds: [component.id],
        name: search,
      },
      {
        pagination,
        components,
        exercises,
        setFilteredExercises,
        setPagination,
      }
    );
  }, [component, pagination.page]);

  useEffect(() => {
    if (!training) return;
    if (!isSameDay(day.date.toDate(), new Date())) return; // only for today

    const unsub = firestore.listenCollection<Workload>(
      `trainings/${training.id}/training-workload`,
      (snapshot) => {
        const data: Workload[] = snapshot.docs.map((doc) =>
          firestoreSerialize(doc.data())
        );

        const progress = WorkloadService.getProgress(training, data);
        setProgress(progress);
      },
      (error) => {
        console.error('Error loading workloads:', error);
      }
    );

    return () => unsub();
  }, [training]);

  useEffect(() => {
    // reset workloads
    if (!isSameDay(day.date.toDate(), new Date())) setProgress([]);
  }, [day]);

  async function handleAddMember(user: AuthUser) {
    if (!training) return;

    const member: Profile = {
      uid: user.uid,
      email: user.email!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prevState = {
      training: structuredClone(training),
      trainings: structuredClone(trainings),
      members: [...members],
    };

    await optimisticUpdate(
      () => {
        // first update member locally
        setMembers((prev) =>
          prev.find((m) => m.uid === member.uid) ? prev : [...prev, member]
        );

        setTraining((prev) => ({
          ...prev!,
          membersIds: [...prev!.membersIds, member.uid],
        }));

        setTrainings((prev) =>
          prev.map((t) =>
            t.id === training.id
              ? { ...t, membersIds: [...t.membersIds, member.uid] }
              : t
          )
        );
      },
      (snapshot) => {
        toast.error('Failed to add member');
        setMembers(snapshot.members);
        setTraining(snapshot.training);
        setTrainings(snapshot.trainings);
      },
      async () =>
        TrainingController.getInstance().addMember(training.id, {
          userId: member.uid,
        }),
      prevState
    );
  }

  async function handleRemoveMember(user: AuthUser) {
    if (!training) return;

    const prevState = {
      training: structuredClone(training),
      trainings: structuredClone(trainings),
      members: [...members],
    };

    await optimisticUpdate(
      () => {
        // first update member locally
        setMembers((prev) => prev.filter((m) => m.uid !== user.uid));

        setTraining((prev) => ({
          ...prev!,
          membersIds: prev!.membersIds.filter((id) => id !== user.uid),
        }));

        setTrainings((prev) =>
          prev.map((t) =>
            t.id === training.id
              ? {
                  ...t,
                  membersIds: t.membersIds.filter((id) => id !== user.uid),
                }
              : t
          )
        );

        // if the removed member is the selected athlete, clear the selection
        if (selectedAthlete?.uid === user.uid) {
          setSelectedAthlete(undefined);
          setSelectedExercises([]);
        }
      },
      (snapshot) => {
        toast.error('Failed to remove member');
        setMembers(snapshot.members);
        setTraining(snapshot.training);
        setTrainings(snapshot.trainings);
      },
      async () =>
        TrainingController.getInstance().removeMember(training.id, {
          userId: user.uid,
        }),
      prevState
    );
  }

  const value: TrainerDayViewContextProps = {
    day,
    setDay,
    training,
    setTraining,
    progress,
    selectedPeriod,
    setSelectedPeriod,
    component,
    setComponent,
    wellness,
    setWellness,
    selectedExercises,
    setSelectedExercises,
    supersets,
    setSupersets,
    members,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
    filteredExercises,
    setFilteredExercises,
    pagination,
    setPagination,
    search,
    setSearch,
    selectedAthleteCompletedWorkloads,
    setSelectedAthleteCompletedWorkloads,
    isSettingAthleteWorkloads,
    previousSelectedAthlete,
    loading,
    setLoading,
    handleAddMember,
    handleRemoveMember,
  };

  return (
    <TrainerDayViewContext.Provider value={value}>
      {children}
    </TrainerDayViewContext.Provider>
  );
}
