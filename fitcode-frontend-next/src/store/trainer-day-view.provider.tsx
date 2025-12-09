'use client';

import { isSameDay } from 'date-fns';
import dayjs from 'dayjs';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import toast from 'react-hot-toast';

import { useGroup } from './group.provider';
import { useMain } from './main.provider';
import { useScreenSize } from './screen-size.provider';
import type { TrainerDayViewContextProps } from '@/app/(trainer)/groups/[group_id]/props';
import type { AuthUser } from '@/core/auth/type/user.type';
import { core } from '@/core/core.service';
import { ExerciseService } from '@/core/exercise/exercise.service';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Method } from '@/core/exercise/type/method.type';
import type { Profile } from '@/core/profile/type/user.type';
import { MainSet } from '@/core/training/enum/main-set.enum';
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
import { TrainingProtocol } from '@/core/training/type/training-protocol.type';

// eslint-disable-next-line
export interface ITrainerDayViewContext extends TrainerDayViewContextProps {}

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayView = () => useContext(TrainerDayViewContext)!;

export type TrainerDayViewCtxExtended = Omit<
  ITrainerDayViewContext,
  'training' | 'component'
> & { training: Training; component: TrainingComponent };

export function TrainerDayViewProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const screenSize = useScreenSize();
  const {
    protocols: mainProviderProtocols,
    exercises,
    setTrainings,
  } = useMain();
  const {
    cycle,
    setCycle,
    dateFrom,
    dateTo,
    group,
    trainings,
    filter,
    setDetectedChanges,
  } = useGroup();

  const params = useSearchParams();
  const pathname = usePathname();

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
  const [loading, setLoading] = useState(false);
  const [protocols, setProtocols] = useState<TrainingProtocol[]>([]);
  const previousSelectedAthlete = useRef<AuthUser | undefined>(undefined);

  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<
    AuthUser | undefined
  >();
  const [selectedSubgroup, setSelectedSubgroup] = useState<Subgroup | null>(
    null
  );

  const [expandedExercisesView, setExpandedExercisesView] = useState(false);

  useEffect(() => {
    if (filter !== 'day') return;

    const trainingId = params.get('training');
    const componentId = params.get('component');

    const training = trainings.find((t) => t.id === trainingId);

    if (!training) return;

    const day = lib.common.date.getDay(training.from);
    const period = core.training.getPeriod(training);
    const mapped = TrainingService.mapData(training, { exercises });

    setDay(day);
    setSelectedPeriod(period);
    setTraining(mapped);

    if (componentId) {
      setComponent(mapped.components.find((c) => c.id === componentId));
      setExpandedExercisesView(true);
    }
  }, [filter]);

  useEffect(() => {
    if (filter === 'day') return;

    const sp = new URLSearchParams(params.toString());
    sp.delete('training');
    sp.delete('component');

    const query = sp.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.replace(url, { scroll: false });
  }, [filter]);

  useEffect(() => {
    const cycleInDate = group.cycles.find((c) =>
      lib.common.date.isBetween(day.date, c.from, c.to)
    );

    if (cycleInDate) setCycle(cycleInDate);
  }, [day]);

  // Update supersets when component or subgroup changes
  useEffect(() => {
    if (selectedSubgroup) setSupersets(selectedSubgroup.supersets);
    else if (component) setSupersets(component.supersets);
    else setSupersets([]);
  }, [selectedSubgroup, component]);

  // Keep track of previous selected athlete
  useEffect(() => {
    if (selectedAthlete) previousSelectedAthlete.current = selectedAthlete;
  }, [selectedAthlete]);

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
      // { componentIds: [component.id], name: search },
      { name: search },
      { pagination, exercises, setFilteredExercises, setPagination }
    );
  }, [component, pagination.page]);

  /**
   * Sync protocols with main provider
   */
  useEffect(() => {
    setProtocols(structuredClone([...mainProviderProtocols.data]));
  }, [mainProviderProtocols]);

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
  }, [training?.id]);

  async function handleAddMember(user: AuthUser) {
    if (!training) return;

    const member: Profile = {
      uid: user.uid,
      email: user.email!,
      createdAt: new Date(),
      updatedAt: new Date(),
      wellness: { userId: user.uid, date: new Date() },
    };

    const prevState = {
      training: structuredClone(training),
      trainings: structuredClone(trainings),
    };

    await lib.common.generic.optimisticUpdate(
      () => {
        // first update member locally
        setTraining((prev) => ({
          ...prev!,
          membersIds: [...prev!.membersIds, member.uid],
        }));

        setTrainings((prev) => ({
          ...prev,
          data: prev.data.map((t) =>
            t.id === training.id
              ? { ...t, membersIds: [...t.membersIds, member.uid] }
              : t
          ),
        }));
      },
      (snapshot) => {
        toast.error('Failed to add member');
        setTraining(snapshot.training);

        setTrainings((prev) => ({ ...prev, data: snapshot.trainings }));
      },
      async () =>
        TrainingController.getInstance().addMember(training.id, {
          userId: member.uid,
        }),
      prevState
    );
  }

  /* Sets new training when new period or day is clicked */
  useEffect(() => {
    if (!selectedPeriod) return;

    const { from, to } = core.training.getPeriodDateRange(
      day.date,
      selectedPeriod.value
    );

    const training = trainings.find(
      (t) => dayjs(t.from).isAfter(from) && dayjs(t.to).isBefore(to)
    );

    if (!training) {
      setTraining(undefined);
      setLoading(false);
      setComponent(undefined);
      return;
    }

    TrainingService.mapData(training, { exercises });

    const foundComponent = component?.id
      ? training.components.find((c) => c.id === component.id)
      : undefined;

    const foundSubgroup =
      foundComponent?.subgroups.find((sg) => sg.id === selectedSubgroup?.id) ||
      null;

    setComponent(foundComponent);
    setSelectedSubgroup(foundSubgroup);
    setTraining(training);
    setLoading(false);

    // --- URL update (guarded) ---
    const params = new URLSearchParams(window.location.search);

    const currentTraining = params.get('training');
    const currentComponent = params.get('component');

    const nextTraining = String(training.id);
    const nextComponent = component ? String(component.id) : null;

    // Only update if something actually changes
    if (
      currentTraining === nextTraining &&
      currentComponent === nextComponent
    ) {
      return;
    }

    params.set('training', nextTraining);
    if (nextComponent) params.set('component', nextComponent);
    else params.delete('component');

    const newUrl = `/groups/${group.id}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedPeriod, trainings]);

  useEffect(() => {
    // if there's only one training on day, always first show the period with the training
    const todaysTrainings = trainings.filter((t) =>
      dayjs(t.from).isSame(day.date, 'day')
    );

    let period: 'AM' | 'PM' = day.date.toDate().getHours() >= 12 ? 'PM' : 'AM';
    if (todaysTrainings.length === 1) {
      period = new Date(todaysTrainings[0].from).getHours() >= 12 ? 'PM' : 'AM';
    }

    setSelectedPeriod({ key: new Date(), value: period });
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

  async function handleRemoveMember(user: AuthUser) {
    if (!training) return;

    const prevState = {
      training: structuredClone(training),
      trainings: structuredClone(trainings),
    };

    await lib.common.generic.optimisticUpdate(
      () => {
        // first update member locally
        setTraining((prev) => ({
          ...prev!,
          membersIds: prev!.membersIds.filter((id) => id !== user.uid),
        }));

        setTrainings((prev) => ({
          ...prev,
          data: prev.data.map((t) =>
            t.id === training.id
              ? {
                  ...t,
                  membersIds: t.membersIds.filter((id) => id !== user.uid),
                }
              : t
          ),
        }));

        // if the removed member is the selected athlete, clear the selection
        if (selectedAthlete?.uid === user.uid) {
          setSelectedAthlete(undefined);
          setSelectedExerciseIds([]);
        }
      },
      (snapshot) => {
        toast.error('Failed to remove member');
        setTraining(snapshot.training);
        setTrainings((prev) => ({ ...prev, data: snapshot.trainings }));
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
    mainSet: MainSet,
    options?: { warmup: boolean; cooldown: boolean }
  ) {
    if (!component || !training || selectedSubgroup?.parentId) return; // disable for virtual subgroups

    // filter out already added exercises
    const existingExerciseIds = supersets
      .map((s) => s.exercises.map((e) => e.id))
      .flat();

    exercises = exercises.filter((e) => !existingExerciseIds.includes(e.id));

    // add exercises to current component/subgroup and its children
    const childrenSubgroups = core.training.subgroup.getChildren(
      selectedSubgroup || component,
      component
    );

    core.training.superset.addExercises(supersets, exercises, mainSet, options);
    for (const sg of childrenSubgroups)
      core.training.superset.addExercises(
        sg.supersets,
        exercises,
        mainSet,
        options
      );

    updateSupersets(supersets, childrenSubgroups);
  }

  function deleteSupersetExercise(
    _exerciseId: string,
    supersetIndex: number,
    exerciseIndex: number
  ) {
    if (!component || !training || selectedSubgroup?.parentId) return; // disable for virtual subgroups

    // remove exercise from current component/subgroup and its children
    const childrenSubgroups = core.training.subgroup.getChildren(
      selectedSubgroup || component,
      component
    );

    const newSupersets = core.training.superset.removeExercise(
      supersets,
      supersetIndex,
      exerciseIndex
    );

    for (const sg of childrenSubgroups)
      sg.supersets = core.training.superset.removeExercise(
        sg.supersets,
        supersetIndex,
        exerciseIndex
      );

    updateSupersets(newSupersets, childrenSubgroups);
  }

  // always add to the beginning
  function addWarmupSuperset() {
    if (!component || !training) return;

    const childrenSubgroups = core.training.subgroup.getChildren(
      selectedSubgroup || component,
      component
    );

    if (supersets.some((s) => s.warmup))
      // remove existing warmup superset first
      updateSupersets(
        supersets.filter((s) => !s.warmup),
        childrenSubgroups
      );
    else {
      // add warmup superset
      const newSuperset: Superset = {
        exercises: [],
        warmup: true,
        mainSet: MainSet.CIRCUIT,
      };

      supersets.unshift(newSuperset);
      for (const sg of childrenSubgroups) sg.supersets.unshift(newSuperset);

      updateSupersets(supersets, childrenSubgroups);
    }
  }

  function addCooldownSuperset() {
    if (!component || !training) return;

    const childrenSubgroups = core.training.subgroup.getChildren(
      selectedSubgroup || component,
      component
    );

    if (supersets.some((s) => s.cooldown))
      // remove existing cooldown superset first
      updateSupersets(
        supersets.filter((s) => !s.cooldown),
        childrenSubgroups
      );
    else {
      // add cooldown superset
      const newSuperset: Superset = {
        exercises: [],
        cooldown: true,
        mainSet: MainSet.CIRCUIT,
      };

      supersets.push(newSuperset);
      for (const sg of childrenSubgroups) sg.supersets.push(newSuperset);

      updateSupersets(supersets, childrenSubgroups);
    }
  }

  function applyNewMethod(method?: Method) {
    if (!component || !training) return;

    if (selectedExerciseIds.length === 0)
      return toast.error('Select exercises to apply the methodology');

    const selectedExercises = exercises.filter((e) =>
      selectedExerciseIds.includes(e.id)
    );

    const childrenSubgroups = core.training.subgroup.getChildren(
      selectedSubgroup || component,
      component
    );

    core.training.superset.applyMethodToExercises(
      method,
      supersets,
      selectedExercises
    );

    for (const sg of childrenSubgroups)
      core.training.superset.applyMethodToExercises(
        method,
        sg.supersets,
        selectedExercises
      );

    updateSupersets(supersets, childrenSubgroups);
  }

  function changeSupersetMainSet(supersetIndex: number, mainSet: MainSet) {
    if (!component || !training) return;

    const childrenSubgroups = core.training.subgroup.getChildren(
      selectedSubgroup || component,
      component
    );

    const supersetsCopy = structuredClone(supersets);
    supersetsCopy[supersetIndex].mainSet = mainSet;

    for (const sg of childrenSubgroups)
      sg.supersets[supersetIndex].mainSet = mainSet;

    updateSupersets(supersetsCopy, childrenSubgroups);
  }

  /**
   * Updates state after modifying supersets in component or subgroup
   */
  function updateSupersets(
    newSupersets: Superset[], // treat as immutable input
    childrenSubgroups: Subgroup[]
  ) {
    if (!component || !training) return;

    const supersets = structuredClone(newSupersets);
    const newSubgroups = component.subgroups.map((sg) => {
      // If this subgroup is the selected one, replace its supersets
      if (selectedSubgroup && sg.id === selectedSubgroup.id)
        return { ...sg, supersets };

      // If this subgroup is one of the children we adjusted, replace it by id
      const child = childrenSubgroups.find((c) => c.id === sg.id);
      return child
        ? { ...child, supersets: structuredClone(child.supersets) }
        : sg;
    });

    const newComponent: TrainingComponent = !selectedSubgroup
      ? {
          ...structuredClone(component),
          supersets,
        }
      : { ...structuredClone(component) };

    if (selectedSubgroup) newComponent.subgroups = newSubgroups;

    const newTraining: Training = {
      ...structuredClone(training),
      components: training.components.map((c) =>
        c.id === newComponent.id ? newComponent : c
      ),
    };

    unstable_batchedUpdates(() => {
      setSupersets(supersets);
      setComponent(newComponent);
      setTraining(newTraining);
      setSelectedSubgroup((prev) => (prev ? { ...prev, supersets } : null));
      setDetectedChanges(true);
    });
  }

  function getGrid2DivisionNumber(): number {
    return screenSize.xs || screenSize.sm
      ? 1
      : screenSize.md && screenSize.isSmallerThanLaptop
        ? 2
        : screenSize.isDesktop
          ? 4
          : 3;
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
    selectedExerciseIds,
    setSelectedExerciseIds,
    supersets,
    setSupersets,
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
    protocols,
    setProtocols,
    previousSelectedAthlete,
    expandedExercisesView,
    setExpandedExercisesView,
    loading,
    setLoading,
    handleAddMember,
    handleRemoveMember,
    addTrainingExercises,
    deleteSupersetExercise,
    addWarmupSuperset,
    addCooldownSuperset,
    applyMethod: applyNewMethod,
    changeSupersetMainSet,
    getGrid2DivisionNumber,
  };

  return (
    <TrainerDayViewContext.Provider value={value}>
      {children}
    </TrainerDayViewContext.Provider>
  );
}
