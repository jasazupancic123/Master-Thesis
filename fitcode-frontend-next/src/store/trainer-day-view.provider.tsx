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
import {
  handleApiRequest,
  SetState,
  SetStateNullable,
} from '@/common/type/state.type';
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
import { useGroup } from './group.provider';
import { Component } from '@/controller/component/type/component.type';
import { Method } from '@/controller/method/type/method.type';
import dayjs from 'dayjs';
import { TrainingService } from '@/controller/training/training.service';

const commonService = CommonService.instance;
const firestore = FirebaseFirestoreUtil.Instance;

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayViewContext = () =>
  useContext(TrainerDayViewContext)!;

export type TrainerDayViewProviderReturnType = ReturnType<
  typeof useTrainerDayViewContext
>;

export type TrainerDayViewProviderReturnTypeDefined = Omit<
  ReturnType<typeof useTrainerDayViewContext>,
  'training' | 'component'
> & {
  training: Training;
  component: TrainingComponent;
};

export function TrainerDayViewProvider(
  props: GroupContextProps & ChildrenProps
) {
  const { children, cycle, dateFrom, dateTo, group, trainings, setTrainings } =
    props;

  const router = useRouter();
  const screenSize = useScreenSize();
  const { components, exercises, methods } = useMain();

  const { setCycle } = useGroup();

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
    const cycleInDate = group.cycles.find((c) =>
      commonService.date.isBetween(day.date, c.from, c.to)
    );
    if (cycleInDate) setCycle(cycleInDate);
  }, [day]);

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

  useEffect(() => {
    // fetch only for selectedAthlete, group avg is already on training itself
    const fetchWorkloads = async () => {
      if (!selectedAthlete) return;

      const combinedComponents = training?.components;

      if (!combinedComponents || !combinedComponents.length) {
        setSelectedAthleteCompletedWorkloads([]);
        return;
      }

      const uniqueExerciseIds = [] as string[];
      combinedComponents.forEach((c) => {
        c.supersets.forEach((s) => {
          s.exercises.forEach((e) => {
            if (!uniqueExerciseIds.includes(e.id)) uniqueExerciseIds.push(e.id);
          });
        });
      });

      if (!uniqueExerciseIds.length) {
        setSelectedAthleteCompletedWorkloads([]);
        return;
      }

      isSettingAthleteWorkloads.current = true;
      handleApiRequest(
        router,
        () =>
          controller.training.findCompletedAthleteWorkloads(
            training.id,
            selectedAthlete.uid
          ),
        (workloads) => {
          setSelectedAthleteCompletedWorkloads(workloads);
          isSettingAthleteWorkloads.current = false;
        },
        undefined,
        'Failed to fetch workloads'
      );
      isSettingAthleteWorkloads.current = false;
    };

    // fetch only for selectedAthlete, group avg is already on training itself
    if (selectedAthlete) fetchWorkloads();
    else setSelectedAthleteCompletedWorkloads([]);
  }, [selectedAthlete]);

  {
    /* Sets new training when new period or day is clicked */
  }
  useEffect(() => {
    if (!selectedPeriod) return;

    setTrainingOnDayView(selectedPeriod, {
      day,
      trainings,
      component,
      setTraining,
      setComponent,
      setLoading,
      components,
      exercises,
      methods,
      selectedSubgroup,
      setSelectedSubgroup,
    });
  }, [selectedPeriod]);

  useEffect(() => {
    // if there's only one training on day, always first show the period with the training
    const todaysTrainings = trainings.filter((t) =>
      dayjs(t.from).isSame(day.date, 'day')
    );

    let period: 'AM' | 'PM' = new Date().getHours() >= 12 ? 'PM' : 'AM';
    if (todaysTrainings.length === 1) {
      period = new Date(todaysTrainings[0].from).getHours() >= 12 ? 'PM' : 'AM';
    }

    const newPeriod = { key: new Date(), value: period };

    setSelectedPeriod(newPeriod);
  }, [day]);

  useEffect(() => {
    if (!component) setSelectedSubgroup(null);
  }, [component]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageSize: screenSize.isUltraSmall ? 3 : screenSize.isMobile ? 6 : 10,
    }));
  }, [window.innerWidth]);

  const setTrainingOnDayView = (
    selectedPeriod: {
      key: Date;
      value: string;
    },
    state: {
      day: Day;
      trainings: Training[];
      component?: TrainingComponent;
      selectedSubgroup: Subgroup | null;
      setSelectedSubgroup: SetState<Subgroup | null>;
      setTraining: SetStateNullable<Training>;
      setComponent: SetStateNullable<TrainingComponent>;
      setLoading: SetState<boolean>;
      components: Component[];
      exercises: Exercise[];
      methods: Method[];
    }
  ) => {
    const {
      day,
      trainings,
      component,
      selectedSubgroup,
      setSelectedSubgroup,
      setComponent,
      setTraining,
      setLoading,
      components,
      exercises,
      methods,
    } = state;

    let from: Date, to: Date;
    if (selectedPeriod.value === 'AM') {
      from = day.date.startOf('day').toDate();
      to = day.date.startOf('day').add(12, 'hours').toDate();
    } else {
      from = day.date.startOf('day').add(11, 'hours').toDate();
      to = day.date.endOf('day').toDate();
    }

    const currentComponentId = component?.id;
    const currentSubgroupId = selectedSubgroup?.id;

    const foundTraining = trainings.find(
      (t) => dayjs(t.from).isAfter(from) && dayjs(t.to).isBefore(to)
    );

    if (!foundTraining) {
      setTraining(undefined);
      setLoading(false);
      setComponent(undefined);
      return;
    }

    TrainingService.mapData(foundTraining, {
      components,
      exercises,
      methods,
    });

    const foundComponent = currentComponentId
      ? foundTraining.components.find((c) => c.id === currentComponentId)
      : undefined;
    const foundSubgroup =
      foundComponent?.subgroups.find((sg) => sg.id === currentSubgroupId) ||
      null;

    setComponent(foundComponent);
    setSelectedSubgroup(foundSubgroup);
    setTraining(foundTraining);
    setLoading(false);
  };

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
