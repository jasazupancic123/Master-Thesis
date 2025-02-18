import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { isAfter, isBefore } from 'date-fns';
import { FieldPath, Query, Timestamp } from 'firebase-admin/firestore';
import { CacheManagerService } from 'src/cache-manager/cache-manager.service';
import { CommonService } from 'src/common/service/common.service';
import { Component } from 'src/component/entity/component.entity';
import { UserService } from 'src/user/service/user.service';
import { User } from '../../common/type/firebase-auth.type';
import {
  SubgroupRef,
  TrainingComponentRef,
  TrainingExerciseRef,
  TrainingRef,
  TrainingSupersetRef,
  UserWorkloadExerciseRef,
} from '../../common/type/firebase-firestore.type';
import { Filter, FindManyOptions } from '../../common/type/orm.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { Group } from '../../group/entity/group.entity';
import { GroupService } from '../../group/service/group.service';
import { ExerciseMeta } from '../entity/exercise-meta.entity';
import { SetData } from '../entity/set-data';
import { Subgroup } from '../entity/subgroup.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';
import { TrainingRepository } from '../repository/training.repository';
import { CreateTraining, UpdateTraining } from '../type/training.type';
import { SubgroupService } from './subgroup.service';
import { TrainingPlanService } from './training-plan.service';
import { UserWorkloadService } from './user-workload.service';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly exerciseService: ExerciseService,
    private readonly subgroupService: SubgroupService,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly userWorkloadService: UserWorkloadService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return query(this.trainingRepository.collection()).get();
  }

  async getDocsByGroup(groupId: string): Promise<Training[]> {
    return this.trainingRepository
      .collection()
      .where('groupId', '==', groupId)
      .where('deletedAt', '==', null)
      .orderBy('from', 'asc')
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.trainingRepository.serialize(doc)),
      );
  }

  async findOne(user: User, ref: TrainingRef): Promise<Training | null> {
    // find training
    const training = await this.trainingRepository.getDoc(ref.trainingId);
    if (!training || training.deletedAt) return null;

    // authorize user
    if (!this.isAuthorized(user, training))
      throw new UnauthorizedException(
        'You are not authorized to view this training',
      );

    return training;
  }

  async findOneOrFail(user: User, ref: TrainingRef): Promise<Training> {
    const training = await this.findOne(user, ref);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findAll(
    user: User,
    options?: FindManyOptions<Training>,
  ): Promise<Training[]> {
    let filter = options?.filter || {};

    if (this.firebaseService.isTrainer(user))
      filter.ownerId = { value: user.uid };

    if (this.firebaseService.isAthlete(user)) {
      const dbUser = await this.userService.findOne(user.uid);
      if (dbUser?.groupsIds.length > 0)
        filter.groupId = { op: 'in', value: dbUser.groupsIds };

      filter.membersIds = { value: user.uid };
    }

    return await this.trainingRepository.getDocs((collection) => {
      let query = this.filter(collection, filter);
      query = query.where('deletedAt', '==', null).orderBy('from', 'asc');
      return query;
    });
  }

  async create(user: User, input: CreateTraining): Promise<Training> {
    const { groupId, cycleId } = input;
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // validate parent references
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    this.groupService.findCycle(cycleId, group);

    // validate trainer and owner
    this.validateTrainer(user);
    this.validateOwner(user.uid, group);

    // validate new trainings time and components
    const components = await this.cacheManagerService.getComponents();
    this.validateComponents(input.componentsIds, components);

    // check overlap between all other trainings
    /* const groupTrainings = await this.getDocsByGroup(group.id);
    await this.validateOverlap(input.from, input.to, groupTrainings); */

    // create training
    const meta = await this.userService.getLastMetas(group.membersIds);
    const data: Omit<Training, 'id' | 'createdAt' | 'updatedAt'> = {
      groupId: group.id,
      cycleId: input.cycleId,
      ownerId: user.uid,
      from: input.from,
      to: input.to,
      membersIds: group.membersIds,
      meta,
      components: input.componentsIds.map((id) => ({
        id,
        color: this.commonService.color.random(),
        from: new Date(),
        to: new Date(),
        subgroups: [],
        supersets: [
          {
            color: this.commonService.color.random(),
            exercises: [],
          },
        ],
      })),
    };

    const trainingId = await this.trainingRepository.addDoc(data);

    return {
      ...data,
      id: trainingId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async copy(
    user: User,
    source: SubgroupRef, // training can be copied from subgroup
    destination: SubgroupRef,
  ) {}

  async update(
    user: User,
    ref: TrainingRef,
    input: UpdateTraining,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // find training
    const training = await this.findOneOrFail(user, ref);

    // TODO - validate whole training

    // validate training times
    /* if (input.from || input.to) {
      const from = input.from || training.from;
      const to = input.to || training.to;
      const trainings = await this.getDocsByGroup(training.groupId);

      this.validateTime(from, to);
      this.validateOverlap(
        from,
        to,
        trainings.filter((t) => t.id !== training.id),
      );
    } */

    /* // add / remove members from training (and its subgroups) and calculate workloads if needed
    if (input.membersIds) {
      const futureTrainings = await this.getDocs((query) =>
        query.where('from', '>=', Timestamp.now()),
      ).then(({ docs }) =>
        docs.map((doc) => this.trainingRepository.serialize(doc)),
      );

      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          const trainingRef = this.trainingRepository.doc(training.id);

          // calculate workloads for future trainings
          await this.updateMembers(
            transaction,
            training,
            ref,
            input.membersIds,
            futureTrainings,
          );

          // remove all subgroup members if members are removed from parent training
          this.subgroupService.updateMembersByTraining(
            transaction,
            training,
            input.membersIds,
          );

          transaction.update(trainingRef, input);
        },
      );
    } else await this.trainingRepository.updateDoc(ref.trainingId, input); */

    if (input.components.length === 0)
      // delete training
      await this.trainingRepository.deleteDoc(ref.trainingId);
    else await this.trainingRepository.updateDoc(ref.trainingId, input);

    return { ...training, ...input };
  }

  async remove(user: User, ref: TrainingRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing training ${ref.trainingId}`);

    // validate parent references and ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // delete training
    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  async updateAthleteWorkload(
    ref: UserWorkloadExerciseRef,
    input: SetData[],
    user: User,
  ) {
    this.logger.log(
      `User ${user.uid} is updating workload sets (exercise ${ref.exerciseId}) for training ${ref.trainingId}: ${JSON.stringify([input])}`,
    );

    if (user.uid !== ref.userId) throw new UnauthorizedException();

    await this.userWorkloadService.updateSets(ref, input);
  }

  async addComponents(
    user: User,
    ref: TrainingRef,
    input: string[],
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is adding component to training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // validate input
    const allComponents = await this.cacheManagerService.getComponents();
    this.checkValidComponents(input, allComponents);
    this.checkDuplicateComponents(training.components, input, allComponents);

    // get query for training
    const [query, updatedTraining] =
      this.trainingPlanService.getAddComponentsQuery(
        training,
        input.map((id) => ({ id, from: null, to: null })),
      );

    // add components
    await this.trainingRepository.updateDoc(training.id, query);
    return updatedTraining;
  }

  async deleteComponent(
    ref: TrainingComponentRef,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is deleting component ${ref.componentId} from training ${ref.trainingId}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // validate input
    this.validateComponent(training, ref);

    // get query for training
    const [query, updatedTraining] =
      this.trainingPlanService.getDeleteComponentQuery(training, ref);

    // delete component
    if (query.components.length === 0) {
      // delete doc
      this.logger.log('No components left, deleting training');
      await this.trainingRepository.deleteDoc(ref.trainingId);
    } else await this.trainingRepository.updateDoc(training.id, query);

    return updatedTraining;
  }

  /* async addSubgroup(
    user: User,
    ref: TrainingRef,
    input: Omit<CreateSubgroup, 'components'>,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is creating training subgroup: ${JSON.stringify(input)}`,
    );

    // validate parent references and ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);
    this.validateTrainingMembers(training, input.membersIds);

    // create subgroup
    const subgroupId = await this.subgroupService.create(ref, {
      ...input,
      components: training.components, // components are copied from parent training
    });

    // NOTE - no need to calculate workloads, because they already exist from parent training

    return {
      ...training,
      subgroups: {
        ...(training.subgroups || {}),
        [subgroupId]: {
          ...input,
          id: subgroupId,
          components: training.components,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };
  }

  async updateSubgroup(
    user: User,
    ref: SubgroupRef,
    input: Pick<UpdateSubgroup, 'name'>,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating training subgroup ${ref.subgroupId}: ${JSON.stringify(input)}`,
    );

    // validate parent references and ownership
    const training = await this.findOneOrFail(user, ref);
    const subgroup = this.subgroupService.findByIdOrFail(
      ref.subgroupId,
      training,
    );

    // validate that all members belong to training
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    await this.subgroupService.update(ref, input);

    return {
      ...training,
      subgroups: {
        ...(training.subgroups || {}),
        [ref.subgroupId]: { ...subgroup, ...input },
      },
    };
  }

  async updateSubgroups(user: User, ref: TrainingRef, input: Subgroup[]) {
    this.logger.log(
      `User ${user.uid} is updating training ${ref.trainingId} subgroups: ${JSON.stringify(input)}`,
    );

    // validate parent references and ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // validate members of each subgroup
      for (const subgroup of input) {
        // this.validateTrainingMembers(training, subgroup.membersIds);

        // update members workload data
        await this.updateMembers(
          transaction,
          training,
          ref,
          subgroup.membersIds,
          [], // subgroup is "alive" only for one training, don't update other trainings
        );
      }

      const docRef = this.trainingRepository.doc(ref.trainingId);
      transaction.update(docRef, {
        subgroups: input.reduce((acc, s) => {
          acc[s.id] = { ...s, components: training.components };
          return acc;
        }, {}),
      });
    });

    return { ...training, subgroups: input } as unknown as Training;
  }

  async addSupersets(
    ref: TrainingComponentRef & SubgroupRef,
    input: Omit<Superset, 'exercises'>[],
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is adding supersets to component ${ref.componentId} in training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // find training and subgroup (if provided)
    if (ref.subgroupId)
      this.subgroupService.findByIdOrFail(ref.subgroupId, training);

    // validate input
    this.validateComponent(training, ref);

    // get query for training / subgroup training
    const [query, updatedTraining] =
      this.trainingPlanService.getAddSupersetsQuery(training, ref, input);

    console.log('addSupersets query:', query);

    // add superset
    await this.trainingRepository.updateDoc(training.id, query);
    return updatedTraining;
  }

  async updateSuperset(
    ref: TrainingSupersetRef & SubgroupRef,
    input: Partial<Superset>,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating superset ${ref.superset} in component ${ref.componentId} for training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // find training and subgroup (if provided)
    if (ref.subgroupId)
      this.subgroupService.findByIdOrFail(ref.subgroupId, training);

    // validate input
    this.validateComponent(training, ref);
    this.validateSuperset(training, ref);

    // get query for training / subgroup training
    const [query, updatedTraining] =
      this.trainingPlanService.getUpdateSupersetQuery(training, ref, input);

    // update superset
    await this.trainingRepository.updateDoc(training.id, query);
    return updatedTraining;
  }

  async deleteSuperset(
    ref: TrainingSupersetRef & SubgroupRef,
    user: User,
  ): Promise<Training> {
    const index = ref.superset;
    this.logger.log(
      `User ${user.uid} is deleting superset ${index} from component ${ref.componentId} in training ${ref.trainingId}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // find training and subgroup (if provided)
    if (ref.subgroupId)
      this.subgroupService.findByIdOrFail(ref.subgroupId, training);

    // validate input
    this.validateComponent(training, ref);
    this.validateSuperset(training, ref);

    // get query for training / subgroup training
    const [query, updatedTraining] =
      this.trainingPlanService.getDeleteSupersetQuery(training, ref);

    // delete superset
    await this.trainingRepository.updateDoc(training.id, query);
    return updatedTraining;
  }

  async addExercises(
    ref: TrainingSupersetRef & SubgroupRef,
    input: [string, CreateTrainingExercise][], // [exerciseId, exercise][]
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is adding exercises to superset ${ref.superset} in component ${ref.componentId} for training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // find training and subgroup (if provided)
    if (ref.subgroupId)
      this.subgroupService.findByIdOrFail(ref.subgroupId, training);

    // validate input
    this.validateComponent(training, ref);
    this.validateSuperset(training, ref);

    // find exercises
    const exerciseIds = input.map(([id]) => id);
    const exercises = await this.exerciseService.findAll(user, {
      filter: { ids: exerciseIds },
    });

    if (exercises.length !== exerciseIds.length)
      throw new BadRequestException('Some exercises are invalid');

    // check that exercise is not in other supersets
    const supersets = training.components[ref.componentId].supersets || [];
    if (
      supersets.some((superset) => {
        for (const exercise of Object.keys(superset?.exercises || {}))
          if (exerciseIds.includes(exercise)) return true;
      })
    )
      throw new BadRequestException('Exercise already exists');

    // validate exercises
    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      exercises,
    );

    if (error) throw new BadRequestException(message);

    // get query for training / subgroup training
    const [query, updatedTraining] =
      this.trainingPlanService.getAddExercisesQuery(training, ref, input);

    // get training and member workloads
    const trainingWorkloads = await this.userWorkloadService.findAllByTraining(
      training.id,
    );

    const userWorkloads = await Promise.all(
      input.map(async ([exerciseId]) => ({
        [exerciseId]: await this.userWorkloadService.findAllByMembers(
          exerciseId,
          training.membersIds,
        ),
      })),
    ).then((results) =>
      results.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    );

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // add exercises
      const docRef = this.trainingRepository.doc(training.id);
      transaction.update(docRef, query);

      // create training workloads
      await Promise.all(
        input.map(([exerciseId, payload]) => {
          const exerciseRef = { ...ref, exerciseId };

          const membersData: {
            [userId: string]: {
              weight: number;
              workloads: UserWorkload[];
            };
          } = {};

          for (const memberId of training.membersIds)
            membersData[memberId] = {
              weight: training.meta[memberId]?.weight || 0,
              workloads: userWorkloads[exerciseId][memberId] || [],
            };

          this.userWorkloadService.createForTraining(
            transaction,
            exerciseRef,
            membersData,
            payload,
            trainingWorkloads,
          );
        }),
      );
    });

    return updatedTraining;
  }

  async updateExercise(
    ref: TrainingExerciseRef & SubgroupRef,
    input: Partial<UpdateTrainingExercise>,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating exercise ${ref.exerciseId} in superset ${ref.superset} for component ${ref.componentId} in training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // find training and subgroup (if provided)
    if (ref.subgroupId)
      this.subgroupService.findByIdOrFail(ref.subgroupId, training);

    // validate input
    this.validateComponent(training, ref);
    this.validateSuperset(training, ref);
    this.validateExercise(training, ref);

    // get query for training / subgroup training
    const {
      meta: oldMeta, // old meta
    } =
      training.components[ref.componentId].supersets[ref.superset].exercises[
        ref.exerciseId
      ];

    const [query, updatedTraining] =
      this.trainingPlanService.getUpdateExerciseQuery(training, ref, input);

    // get training and member workloads
    const trainingWorkloads = await this.userWorkloadService.findAllByTraining(
      training.id,
    );

    const userWorkloads = await this.userWorkloadService.findAllByMembers(
      ref.exerciseId,
      training.membersIds,
    );

    const membersData = training.membersIds.reduce((acc, userId) => {
      acc[userId] = {
        weight: training.meta[userId]?.weight || 0,
        workloads: userWorkloads[userId] || [],
      };

      return acc;
    }, {});

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      const docRef = this.trainingRepository.doc(training.id);

      // update training workload
      if (input.meta) {
        const isWorkloadTypeChanged =
          input.meta?.workloadType &&
          input.meta.workloadType !== oldMeta.workloadType;
        const isWorkloadValueChanged =
          input.meta?.workloadValue &&
          input.meta.workloadValue !== oldMeta.workloadValue;

        // if nothing of workload type or workload value changed, don't update workloads
        if (isWorkloadTypeChanged || isWorkloadValueChanged)
          this.userWorkloadService.updateByTraining(
            transaction,
            ref,
            membersData,
            { meta: input.meta },
            trainingWorkloads,
          );
      }

      transaction.update(docRef, query);
    });

    return updatedTraining;
  }

  async deleteExercise(
    ref: TrainingExerciseRef & SubgroupRef,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is deleting exercise ${ref.exerciseId} from superset ${ref.superset} in component ${ref.componentId} for training ${ref.trainingId}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // find training and subgroup (if provided)
    if (ref.subgroupId)
      this.subgroupService.findByIdOrFail(ref.subgroupId, training);

    // validate input
    this.validateComponent(training, ref);
    this.validateSuperset(training, ref);
    this.validateExercise(training, ref);

    // get query for training / subgroup training
    const [query, updatedTraining] =
      this.trainingPlanService.getDeleteExerciseQuery(training, ref);

    console.log('deleteExercise query:', query);

    // delete exercise
    await this.trainingRepository.updateDoc(training.id, query);
    return updatedTraining;
  } */

  private filter(query: Query, filter: Filter<Training>) {
    if (filter.ids?.length)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.groupId?.value)
      query = query.where(
        'groupId',
        filter.groupId?.op || '==',
        filter.groupId.value,
      );

    if (filter.cycleId?.value)
      query = query.where('cycleId', '==', filter.cycleId.value);

    if (filter.ownerId)
      query = query.where('ownerId', '==', filter.ownerId.value);

    if (filter.membersIds)
      query = query.where(
        'membersIds',
        'array-contains',
        filter.membersIds.value,
      );

    if (filter.copiedFromId)
      query = query.where(
        'copiedFromId',
        filter.copiedFromId.op || '==',
        filter.copiedFromId.value,
      );

    if (filter.from && filter.to) {
      query = query.where('from', '>=', Timestamp.fromDate(filter.from.value));
      query = query.where('to', '<=', Timestamp.fromDate(filter.to.value));
    }

    if (filter.from)
      query = query.where(
        'from',
        filter.from.op || '>=',
        Timestamp.fromDate(filter.from.value),
      );

    if (filter.to)
      query = query.where(
        'to',
        filter.to.op || '<=',
        Timestamp.fromDate(filter.to.value),
      );

    return query;
  }

  /* private async updateMembers(
    transaction: Transaction,
    training: Training,
    ref: SubgroupRef,
    newMemberIds: string[],
    trainings: Training[], // trainings to create new workload data
  ) {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.membersIds`
      : `membersIds`;

    const currentMemberIds = ref.subgroupId
      ? training.subgroups[ref.subgroupId]?.membersIds
      : training.membersIds;

    const added = newMemberIds.filter(
      (memberId) => !currentMemberIds.includes(memberId),
    );

    const metas = await this.userService.getLastMetas(added);

    // update members
    const docRef = this.trainingRepository.doc(training.id);
    transaction.update(docRef, { [prefix]: newMemberIds });

    // for each added user, create new workload for trainings in the future
    await Promise.all(
      [training, ...trainings].map(async (training) => {
        const exercises = this.getAllTrainingExercises(training);
        const trainingWorkloads =
          await this.userWorkloadService.findAllByTraining(training.id);

        exercises.map(async ({ componentId, superset, exerciseId, meta }) => {
          const exerciseRef = { ...ref, componentId, superset, exerciseId };
          const membersWorkloads =
            await this.userWorkloadService.findAllByMembers(exerciseId, added);

          const membersData = {};
          for (const userId of added)
            membersData[userId] = {
              weight: metas[userId].weight || 0,
              workloads: membersWorkloads[userId] || [],
            };

          await this.userWorkloadService.createForTraining(
            transaction,
            exerciseRef,
            membersData,
            { meta },
            trainingWorkloads,
          );
        });
      }),
    );
  } */

  /**
   * Return all exercises from training.
   *
   * ```ts
   * const training = {
   *  components: {
   *    speed: {
   *      supersets: [
   *        {
   *          exercises: {
   *            sprints: { meta: { sets: 3, reps: 12 } },
   *            sleds: { meta: { sets: 2, reps: 10 } },
   *          }
   *        }
   *      ]
   *     },
   *     ...
   *  }
   * }
   *
   * getAllTrainingExercises(training);
   * // => [
   * //  ['sprints', { ... }],
   * //  ['sleds', { ... }],
   * //  [...]
   * // ]
   * ```
   */
  /* private getAllTrainingExercises(training: Training): {
    componentId: string;
    superset: number;
    exerciseId: string;
    meta: ExerciseMeta;
  }[] {
    const result = [];
    const stack = [
      {
        obj: training as any,
        componentId: null as string,
        superset: null as number,
      },
    ];

    while (stack.length > 0) {
      const { obj, componentId, superset } = stack.pop();

      if (obj['exercises'] && typeof obj['exercises'] === 'object')
        for (const [exerciseId, exerciseData] of Object.entries(
          obj['exercises'],
        ))
          if (exerciseData['meta'])
            result.push({
              componentId,
              superset,
              exerciseId,
              meta: exerciseData['meta'],
            });

      if (obj.components && typeof obj.components === 'object') {
        for (const [compId, component] of Object.entries(obj.components)) {
          if (component['supersets'] && Array.isArray(component['supersets'])) {
            for (let i = 0; i < component['supersets'].length; i++) {
              stack.push({
                obj: component['supersets'][i],
                componentId: compId,
                superset: i,
              });
            }
          }
        }
      }
    }

    return result;
  } */

  private isAuthorized(user: User, training: Training): boolean {
    return (
      training.ownerId === user.uid || training.membersIds.includes(user.uid)
    );
  }

  private validateTime(from: Date, to: Date) {
    if (this.commonService.date.isAfter(from, to))
      throw new BadRequestException('Invalid training time');
  }

  private validateTrainer(user: User) {
    if (!this.firebaseService.isTrainer(user))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private validateOwner(userId: string, groupOrTraining: Group | Training) {
    if (!this.groupService.isOwner(userId, groupOrTraining))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private validateComponents(componentsIds: string[], components: Component[]) {
    for (const componentId of componentsIds) {
      const component = components.find((c) => c.id === componentId);
      if (component.parent)
        throw new BadRequestException(`Component ${component.id} is not root`);
    }
  }

  private validateTrainingMembers(training: Training, memberIds: string[]) {
    if (training.membersIds.some((memberId) => memberIds.includes(memberId)))
      throw new BadRequestException('You cannot add these members to training');
  }

  private async validateOverlap(
    from: Date,
    to: Date,
    trainings: Pick<Training, 'from' | 'to'>[],
  ): Promise<void> {
    const isOverlap = trainings.some(
      (training) =>
        (isBefore(from, training.from) && isAfter(to, training.to)) ||
        (isAfter(from, training.from) && isBefore(to, training.to)) ||
        (isBefore(from, training.to) && isAfter(to, training.from)) ||
        (isAfter(from, training.from) && isBefore(to, training.to)),
    );

    if (isOverlap)
      throw new BadRequestException('Training overlaps with other training');
  }

  private checkValidComponents(
    componentIds: string[],
    components: Component[],
  ) {
    if (!components.some((component) => componentIds.includes(component.id)))
      throw new BadRequestException('Some components are invalid');
  }

  private checkDuplicateComponents(
    existingComponents: TrainingComponent[],
    inputComponentIds: string[],
    allComponents: Component[],
  ) {
    // components must be unique
    const duplicates: Component[] = [];
    for (const id of inputComponentIds)
      if (existingComponents.find((c) => c.id === id))
        duplicates.push(allComponents.find((c) => c.id === id));

    if (duplicates.length)
      throw new BadRequestException(
        `Duplicate components`,
      );
  }

  private validateComponent(training: Training, ref: TrainingComponentRef) {
    if (!training.components.find((c) => c.id === ref.componentId))
      throw new BadRequestException('Training component not found');
  }

  /* private validateSuperset(training: Training, ref: TrainingSupersetRef) {
    const supersets = training.components[ref.componentId].supersets || [];
    if (ref.superset < 0 || ref.superset >= supersets.length)
      throw new BadRequestException('Superset index out of bounds');
  }

  private validateExercise(training: Training, ref: TrainingExerciseRef) {
    const supersets = training.components[ref.componentId].supersets || [];
    const superset = supersets[ref.superset];
    const exercises = superset.exercises || {};
    if (!exercises[ref.exerciseId])
      throw new BadRequestException('Exercise not found in superset');
  } */
}
