import { isSameDay } from 'date-fns';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useGroup } from './group.provider';
import { useMain } from './main.provider';
import { useScreenSize } from './screen-size.provider';
import type {
  GroupContextProps,
  TrainerDayViewContextProps,
} from '@/app/(trainer)/groups/[group_id]/props';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Component } from '@/core/component/type/component.type';
import { Controller } from '@/core/controller';
import { core } from '@/core/core.service';
import { ExerciseService } from '@/core/exercise/exercise.service';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Method } from '@/core/method/type/method.type';
import type { Profile } from '@/core/profile/type/user.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import { SubgroupUtil } from '@/core/training/custom-shit-subgroup.util';
import type { MainSet } from '@/core/training/enum/main-set.enum';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type {
  UserProgress,
  Workload,
} from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import type { Day } from '@/lib/common/service/date.util';
import type { Pagination } from '@/lib/common/type/paginate.type';
import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayView = () => useContext(TrainerDayViewContext)!;

export type TrainerDayViewCtx = ReturnType<typeof useTrainerDayView>;

export type TrainerDayViewCtxExtended = Omit<
  TrainerDayViewCtx,
  'training' | 'component'
> & { training: Training; component: TrainingComponent };

export function TrainerDayViewProvider(
  props: GroupContextProps & React.PropsWithChildren
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

  // check if it's after 12:00, then set to PM, else AM
  const [selectedPeriod, setSelectedPeriod] = useState<
    { key: Date; value: 'AM' | 'PM' } | undefined
  >(undefined);

  const [day, setDay] = useState<Day>(lib.common.date.getToday());
  const [training, setTraining] = useState<Training | undefined>();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [component, setComponent] = useState<TrainingComponent | undefined>();
  const [supersets, setSupersets] = useState<Superset[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [wellness, setWellness] = useState<WellnessZScore[]>([]);
  const [loading, setLoading] = useState(false);
  const isSettingAthleteWorkloads = useRef(false);
  const previousSelectedAthlete = useRef<AuthUser | undefined>(undefined);

  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
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

  useEffect(() => {
    const cycleInDate = group.cycles.find((c) =>
      lib.common.date.isBetween(day.date, c.from, c.to)
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
        () => controller.institution.findMembers(group.institutionId),
        (members) => setMembers(members),
        undefined
      );
    }

    async function fetchWellness() {
      handleApiRequest(
        router,
        () => controller.profile.getWellnessByInstitution(group.institutionId),
        (wellness) => {
          setWellness(wellness);
        },
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
    setSelectedAthlete(undefined);
    setSelectedExerciseIds([]);
  }, [cycle, dateFrom, dateTo]);

  /**
   * Filter exercises
   */
  useEffect(() => {
    if (!component) return;

    ExerciseService.paginate(
      { componentIds: [component.id], name: search },
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
    if (!isSameDay(day.date.toDate(), new Date())) {
      // workloads only for current day
      setProgress([]);
      return;
    }

    const unsub = lib.firebase.firestore.listenCollection<Workload>(
      `trainings/${training.id}/training-workload`,
      (snapshot) => {
        const data: Workload[] = snapshot.docs.map((doc) =>
          lib.firebase.firestore.serialize(doc.data())
        );

        const progress = core.training.workload.getProgress(training, data);
        setProgress(progress);
      },
      (error) => {
        console.error('Error loading workloads:', error);
      }
    );

    return () => unsub();
  }, [training]);

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

    await lib.common.generic.optimisticUpdate(
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

  /* Sets new training when new period or day is clicked */
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

    await lib.common.generic.optimisticUpdate(
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
          setSelectedExerciseIds([]);
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

  function addTrainingExercises(
    exercises: TrainingExercise[],
    mainSet: MainSet
  ) {
    if (!component || !training) return;
    if (selectedSubgroup?.parentId) return; // disable for virtual subgroups

    const newComponent = structuredClone(component);
    const newTraining = structuredClone(training);
    const newSupersets = structuredClone(supersets);

    // filter out already added exercises
    const existingExerciseIds = newSupersets
      .map((s) => s.exercises.map((e) => e.id))
      .flat();

    exercises = exercises.filter((e) => !existingExerciseIds.includes(e.id));
    core.training.superset.addExercises(newSupersets, exercises, mainSet);

    // update component or subgroup supersets
    if (!selectedSubgroup) newComponent.supersets = newSupersets;
    else
      newComponent.subgroups = newComponent.subgroups.map((sg) =>
        sg.id === selectedSubgroup.id ? { ...sg, supersets: newSupersets } : sg
      );

    // update training components
    newTraining.components = newTraining.components.map((c) =>
      c.id === newComponent.id ? newComponent : c
    );

    setSupersets(newSupersets);
    setComponent(newComponent);
    setTraining(newTraining);
    setSelectedSubgroup((prev) =>
      !prev ? null : { ...prev, supersets: newSupersets }
    );
  }

  function deleteSupersetExercise(
    exerciseId: string,
    supersetIndex: number,
    exerciseIndex: number
  ) {
    // if it's custom workloads subgroup, then dissable
    if (!component || !training || selectedSubgroup?.parentId) return;

    const updatedSubgroup: Subgroup | null = selectedSubgroup
      ? {
          ...selectedSubgroup,
          supersets: core.training.superset.removeExercise(
            selectedSubgroup.supersets,
            exerciseIndex,
            supersetIndex
          ),
        }
      : null;

    if (updatedSubgroup) {
      updatedSubgroup.supersets = updatedSubgroup.supersets.filter(
        (s) => s.exercises.length > 0
      );

      setSelectedSubgroup(updatedSubgroup);
    }

    const updatedComponent = updatedSubgroup
      ? {
          ...component,
          subgroups: component.subgroups.map((sg) =>
            sg.id === updatedSubgroup.id ? updatedSubgroup : sg
          ),
        }
      : {
          ...component,
          supersets: core.training.superset.removeExercise(
            component.supersets,
            exerciseIndex,
            supersetIndex
          ),
        };

    updatedComponent.subgroups = SubgroupUtil.removeExerciseFromSuperset(
      updatedComponent,
      updatedSubgroup,
      supersetIndex,
      exerciseIndex
    );

    setComponent(updatedComponent);

    const updatedTraining = structuredClone(training);

    if (component.id === WARMUP_ID) updatedTraining.warmup = updatedComponent;
    else if (component.id === COOLDOWN_ID)
      updatedTraining.cooldown = updatedComponent;
    else
      updatedTraining.components = training.components.map((c) =>
        c.id === component.id ? updatedComponent : c
      );

    setSelectedExerciseIds((prev) => prev.filter((ex) => ex !== exerciseId));
    setTraining(updatedTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
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
    selectedExerciseIds,
    setSelectedExerciseIds,
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
    addTrainingExercises,
    deleteSupersetExercise,
  };

  return (
    <TrainerDayViewContext.Provider value={value}>
      {children}
    </TrainerDayViewContext.Provider>
  );
}
