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
import { Controller } from '@/core/controller';
import { core } from '@/core/core.service';
import { ExerciseService } from '@/core/exercise/exercise.service';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Profile } from '@/core/profile/type/user.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
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
import { handleApiRequest } from '@/lib/common/type/state.type';

interface Props extends GroupContextProps, React.PropsWithChildren {}

// eslint-disable-next-line
export interface ITrainerDayViewContext extends TrainerDayViewContextProps {}

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayView = () => useContext(TrainerDayViewContext)!;

export type TrainerDayViewCtxExtended = Omit<
  ITrainerDayViewContext,
  'training' | 'component'
> & { training: Training; component: TrainingComponent };

export function TrainerDayViewProvider(props: Props) {
  const { children, cycle, dateFrom, dateTo, group, trainings, setTrainings } =
    props;

  const router = useRouter();
  const screenSize = useScreenSize();
  const { exercises } = useMain();
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

  const [expandedExercisesView, setExpandedExercisesView] = useState(false);

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

  // Fetch group members and wellness data
  useEffect(() => {
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
      // { componentIds: [component.id], name: search },
      { name: search },
      { pagination, exercises, setFilteredExercises, setPagination }
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
    };

    await lib.common.generic.optimisticUpdate(
      () => {
        // first update member locally
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

    // put training id in url, but don't push to history
    const url = `/groups/${group.id}/training/${training.id}`;
    window.history.replaceState(null, '', url);
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

    core.training.superset.addExercises(supersets, exercises, mainSet);
    for (const sg of childrenSubgroups)
      core.training.superset.addExercises(sg.supersets, exercises, mainSet);

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

  /**
   * Updates state after modifying supersets in component or subgroup
   */
  function updateSupersets(
    newSupersets: Superset[], // treat as immutable input
    childrenSubgroups: Subgroup[]
  ) {
    if (!component || !training) return;

    // 1) Update the target component (not in place)
    const nextSubgroups = component.subgroups.map((sg) => {
      // If this subgroup is the selected one, replace its supersets
      if (selectedSubgroup && sg.id === selectedSubgroup.id) {
        return { ...sg, supersets: [...newSupersets] };
      }
      // If this subgroup is one of the children we adjusted, replace it by id
      const child = childrenSubgroups.find((c) => c.id === sg.id);
      return child ? { ...child, supersets: [...child.supersets] } : sg;
    });

    const nextComponent: TrainingComponent = !selectedSubgroup
      ? { ...component, supersets: [...newSupersets], subgroups: nextSubgroups }
      : { ...component, subgroups: nextSubgroups };

    // 2) Update training.components immutably
    const nextTraining: Training = {
      ...training,
      components: training.components.map((c) =>
        c.id === nextComponent.id ? nextComponent : c
      ),
    };

    // 3) Push all-new references into state
    setSupersets([...newSupersets]); // new array ref
    setComponent(nextComponent); // new object ref
    setTraining(nextTraining); // new object ref
    setSelectedSubgroup((prev) =>
      prev ? { ...prev, supersets: [...newSupersets] } : null
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
    expandedExercisesView,
    setExpandedExercisesView,
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
