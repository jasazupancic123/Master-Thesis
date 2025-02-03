import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  FieldPath,
  FieldValue,
  Query,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore';
import { Training } from '../entity/training.entity';
import { ExerciseService } from '../../exercise/service/exercise.service';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
} from '../../common/type/orm.type';
import { GroupService } from '../../group/service/group.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { TrainingRepository } from '../repository/training.repository';
import {
  SubgroupRef,
  TrainingComponentRef,
  TrainingExerciseRef,
  TrainingRef,
  TrainingSupersetRef,
  UserMetaRef,
} from '../../common/type/firebase-firestore.type';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { SubgroupService } from '../../group/service/subgroup.service';
import {
  CreateTraining,
  MappedTraining,
  UpdateTraining,
} from '../type/training.type';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Group } from '../../group/entity/group.entity';
import { TrainingWorkloadService } from './training-workload.service';
import { isAfter, isBefore, startOfDay } from 'date-fns';
import { CacheManagerService } from 'src/cache-manager/cache-manager.service';
import { Component } from 'src/component/entity/component.entity';
import { CommonService } from 'src/common/service/common.service';
import { UpdateTrainingComponent } from '../type/training-component.type';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingSuperset } from '../entity/training-superset.entity';
import {
  CreateTrainingExercise,
  UpdateTrainingExercise,
} from '../type/training-exercise.type';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { UserService } from 'src/user/service/user.service';
import { TrainingWorkload } from '../entity/training-workload.entity';
import { UserMeta } from 'src/user/entity/user-meta.entity';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => SubgroupService))
    private readonly subgroupService: Wrapper<SubgroupService>,
    private readonly trainingWorkloadService: TrainingWorkloadService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  async findOne(
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training> & { user?: User },
  ): Promise<Training | null> {
    // find training
    const training = await this.trainingRepository.getDoc(ref.trainingId);
    if (!training || training.deletedAt) return null;

    // authorize user
    if (options?.user)
      if (!this.isAuthorized(options.user, training))
        throw new UnauthorizedException(
          'You are not authorized to view this training',
        );

    return training;
  }

  async findOneOrFail(
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training> & { user?: User },
  ): Promise<Training> {
    const training = await this.findOne(ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findAll(
    options?: FindManyOptions<Training> & { user?: User },
  ): Promise<Training[]> {
    let filter = options?.filter || {};

    if (options?.user) {
      if (this.firebaseService.isTrainer(options.user)) {
        if (!filter.groupId || !filter.cycleId)
          throw new BadRequestException('Group ID or cycle ID are missing');

        filter.ownerId = { value: options.user.uid };
      }

      if (this.firebaseService.isAthlete(options.user)) {
        const { groupsIds } = await this.userService.findOne(options.user.uid);
        filter.membersIds = { value: options.user.uid };
        filter.groupId = { op: 'in', value: groupsIds };
      }
    }

    let trainings = await this.trainingRepository.getDocs((collection) => {
      let query = this.filter(collection, filter);
      if (options?.paginate) query = this.paginate(query, options.paginate);
      query = query.where('deletedAt', '==', null).orderBy('from', 'asc');
      return query;
    });

    return trainings;
  }

  async create(
    input: CreateTraining,
    options: { user: User },
  ): Promise<Training> {
    const { user } = options;
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // find parent references
    const group = await this.groupService.findOneOrFail(
      { groupId: input.groupId },
      { user, populate: ['availableMembersIds'] },
    );

    // validate data
    const components = await this.cacheManagerService.getComponents();
    this.validateTime(input.from, input.to);
    this.validateTrainer(user);
    this.validateOwner(user.uid, group);
    this.validateComponents(input.componentIds, components);
    await this.validateOverlap(group.id, input.from, input.to);
    await this.validateSubgroup({
      groupId: group.id,
      subgroupId: input.subgroupId,
    });

    // create training
    const componentsInput = Object.fromEntries(
      input.componentIds.map((componentId) => [
        componentId,
        {
          id: componentId,
          order: 0,
          supersets: [
            {
              order: 0,
              exercises: {},
            },
          ],
        },
      ]),
    );

    const bw = Object.fromEntries(
      await Promise.all(
        group.membersIds.map(async (id) => [
          id,
          await this.userService.getLastMeta({ uid: id }),
        ]),
      ),
    );

    const trainingId = await this.trainingRepository.addDoc({
      groupId: group.id,
      ownerId: user.uid,
      cycleId: input.cycleId,
      membersIds: group.membersIds,
      subgroupId: input.subgroupId || null,
      from: input.from,
      to: input.to,
      components: componentsInput,
      meta: bw,
    });

    return {
      id: trainingId,
      groupId: group.id,
      group: group,
      cycleId: input.cycleId,
      cycle: null,
      ownerId: user.uid,
      membersIds: group.membersIds,
      subgroupId: input.subgroupId || null,
      subgroup: null,
      copiedFromId: input.copiedFromId || null,
      from: input.from,
      to: input.to,
      components: componentsInput,
      meta: bw,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async copy(
    source: { trainingId: string },
    destination: {
      groupId: string;
      cycleId: string;
      subgroupId: string | null;
    },
    options: { user: User },
  ) {
    /* const { user } = options;
    this.logger.debug(
      `Copying training ${source.trainingId} (user ${user.uid})`,
    );

    // copy all training data from source to destination
    const sourceTraining = await this.findOneOrFail(
      { trainingId: source.trainingId },
      {
        user,
        populate: [
          'subgroup',
          'components',
          'components.supersets',
          'components.supersets.exercises',
        ],
      },
    );

    const group = await this.groupService.findOneOrFail(
      { groupId: destination.groupId },
      { populate: ['availableMembersIds'] },
    );

    await this.validateTrainer(user);
    await this.validateOwner(user.uid, group);

    const subgroup = destination.subgroupId
      ? await this.subgroupService.findOneOrFail(destination)
      : null;

    if (!subgroup)
      this.validateAvailableMembersIds(
        group.availableMembersIds,
        sourceTraining.membersIds,
      );

    const membersIds = subgroup
      ? subgroup.membersIds
      : group.availableMembersIds;

    // create new training with the same data as the source
    const trainingId = await this.trainingRepository.addDoc({
      groupId: group.id,
      ownerId: group.ownerId,
      cycleId: destination.cycleId,
      subgroupId: subgroup?.id || null,
      membersIds,
      copiedFromId: sourceTraining.id,
      from: sourceTraining.from,
      to: sourceTraining.to,
    });

    // copy training components
    const components = await this.trainingComponentService.createMany(
      { trainingId },
      sourceTraining.components.map((component) => ({
        componentId: component.componentId,
        color: component.color,
        supersets: component.supersets.map((superset) => ({
          color: superset.color,
          exercises: superset.exercises.map((exercise) => ({
            membersIds,
            exerciseId: exercise.exerciseId,
            meta: exercise.meta,
            color: exercise.color,
          })),
        })),
      })),
      options,
    );

    return {
      id: trainingId,
      createdAt: new Date(),
      updatedAt: new Date(),
      groupId: group.id,
      group,
      cycleId: destination.cycleId,
      ownerId: group.ownerId,
      membersIds,
      subgroupId: subgroup?.id || null,
      subgroup,
      copiedFromId: sourceTraining.id,
      from: sourceTraining.from,
      to: sourceTraining.to,
      components,
    }; */
  }

  async update(
    ref: Required<TrainingRef>,
    input: UpdateTraining,
    options: { user: User },
  ): Promise<Training> {
    this.logger.log(
      `User ${options.user.uid} is updating training: ${JSON.stringify(input)}`,
    );

    // find training
    const training = await this.findOneOrFail(ref, options);

    if (input.from || input.to) {
      const from = input.from || training.from;
      const to = input.to || training.to;

      this.validateTime(from, to);
      await this.validateOverlap(training.groupId, from, to, training.id);
    }

    if (input.membersIds) {
      const added = input.membersIds.filter(
        (memberId) => !training.membersIds.includes(memberId),
      );

      const removed = training.membersIds.filter(
        (memberId) => !input.membersIds.includes(memberId),
      );

      if (added.length) await this.addMembers([ref.trainingId], added, options);
      if (removed.length) await this.removeMembers([ref.trainingId], removed);
    }

    await this.trainingRepository.updateDoc(ref.trainingId, input);
    return await this.findOneOrFail(ref, options);
  }

  async updateMemberBodyweight(
    transaction: Transaction,
    userId: string,
    trainingIds: string[],
    weight: number,
  ) {
    await Promise.all(
      trainingIds.map((trainingId) => {
        const docRef = this.trainingRepository.doc(trainingId);
        transaction.update(docRef, {
          [`bw.${userId}`]: weight,
        });
      }),
    );
  }

  async remove(
    ref: Required<TrainingRef>,
    options: { user: User },
  ): Promise<void> {
    this.logger.log(
      `User ${options.user.uid} is removing training ${ref.trainingId}`,
    );

    await this.findOneOrFail(ref, options);
    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  async addComponents(
    ref: Required<TrainingRef>,
    input: [string, TrainingComponent][], // [componentId, component input][]
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is adding component to training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // find training
    const training = await this.findOneOrFail(ref, { user });

    // find all components
    const components = await this.cacheManagerService.getComponents();
    const inputComponentsIds = input.map(([componentId]) => componentId);
    if (
      !components.some((component) => inputComponentsIds.includes(component.id))
    )
      throw new BadRequestException('Some components are invalid');

    // components must be unique
    const duplicates: Component[] = [];
    for (const componentId of inputComponentsIds)
      if (Object.keys(training.components).find((cId) => cId === componentId))
        duplicates.push(components.find((c) => c.id === componentId));

    if (duplicates.length)
      throw new BadRequestException(
        `Components ${duplicates.map((c) => c.name.toLowerCase()).join(', ')} already exist in the training`,
      );

    const addComponentsInput = Object.fromEntries(
      input.map(([componentId, trainingComponent]) => [
        `components.${componentId}`,
        {
          id: componentId,
          order:
            trainingComponent.order || Object.keys(training.components).length,
          color: trainingComponent.color || this.commonService.color.random(),
          supersets: trainingComponent.supersets?.length
            ? trainingComponent.supersets.map((superset) => ({
                order: superset.order,
                color: superset.color,
                exercises: superset.exercises,
              }))
            : [
                {
                  color: this.commonService.color.random(),
                  exercises: {},
                },
              ],
        },
      ]),
    );

    await this.trainingRepository.updateDoc(training.id, addComponentsInput);
    return {
      ...training,
      components: {
        ...training.components,
        ...Object.fromEntries(
          Object.entries(addComponentsInput).map(([componentId, data]) => [
            componentId.replace(/^components\./, ''),
            data,
          ]),
        ),
      },
    };
  }

  async updateComponent(
    ref: Required<TrainingComponentRef>,
    input: UpdateTrainingComponent,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating component ${ref.componentId} for training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // find training component
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId))
      throw new BadRequestException('Training component not found');

    await this.trainingRepository.updateDoc(training.id, {
      ...(input.color && {
        [`components.${ref.componentId}.color`]: input.color,
      }),
      ...(input.order && {
        [`components.${ref.componentId}.order`]: input.order,
      }),
      ...(input.supersets && {
        [`components.${ref.componentId}.supersets`]: input.supersets,
      }),
    });

    return {
      ...training,
      components: {
        ...training.components,
        [ref.componentId]: {
          ...training.components[ref.componentId],
          ...input,
        },
      },
    };
  }

  async deleteComponent(
    ref: Required<TrainingComponentRef>,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is deleting component ${ref.componentId} from training ${ref.trainingId}`,
    );

    // find training
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId)) {
      throw new BadRequestException('Training component not found');
    }

    // delete component from training
    await this.trainingRepository.updateDoc(training.id, {
      [`components.${ref.componentId}`]: FieldValue.delete(),
    });

    // remove component from the returned object
    const { [ref.componentId]: _, ...updatedComponents } = training.components;

    return {
      ...training,
      components: updatedComponents,
    };
  }

  async addSupersets(
    ref: Required<TrainingComponentRef>,
    input: TrainingSuperset[],
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is adding supersets to component ${ref.componentId} in training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // find training component
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId))
      throw new BadRequestException('Training component not found');

    // validate exercises
    const exerciseIds = input.map((item) => Object.keys(item.exercises)).flat();
    if (exerciseIds.length)
      await this.validateTrainingExercises(ref, exerciseIds, user);

    // add supersets to component
    const supersets = training.components[ref.componentId].supersets || [];
    const addSupersets = [
      ...supersets,
      ...input.map((item) => ({
        color: item.color,
        exercises: item.exercises,
      })),
    ];

    await this.trainingRepository.updateDoc(training.id, {
      [`components.${ref.componentId}.supersets`]: addSupersets,
    });

    return {
      ...training,
      components: {
        ...training.components,
        [ref.componentId]: {
          ...training.components[ref.componentId],
          supersets: addSupersets,
        },
      },
    };
  }

  async updateSuperset(
    ref: Required<TrainingSupersetRef>,
    input: Partial<TrainingSuperset>,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating superset ${ref.superset} in component ${ref.componentId} for training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // find training component
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId))
      throw new BadRequestException('Training component not found');

    let supersets = training.components[ref.componentId].supersets || [];
    if (ref.superset < 0 || ref.superset >= supersets.length)
      throw new BadRequestException('Superset index out of bounds');

    // update superset
    const updatedSuperset = { ...supersets[ref.superset], ...input };
    supersets = supersets.filter((_, i) => i !== ref.superset); // Remove old superset

    // insert at new index if 'order' is specified, otherwise keep the same index
    const newIndex = input.order !== undefined ? input.order : ref.superset;
    supersets.splice(newIndex, 0, updatedSuperset);

    await this.trainingRepository.updateDoc(training.id, {
      [`components.${ref.componentId}.supersets`]: supersets,
    });

    return {
      ...training,
      components: {
        ...training.components,
        [ref.componentId]: {
          ...training.components[ref.componentId],
          supersets,
        },
      },
    };
  }

  async deleteSuperset(
    ref: Required<TrainingSupersetRef>,
    user: User,
  ): Promise<Training> {
    const index = ref.superset;
    this.logger.log(
      `User ${user.uid} is deleting superset ${index} from component ${ref.componentId} in training ${ref.trainingId}`,
    );

    // find training component
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId))
      throw new BadRequestException('Training component not found');

    let supersets = training.components[ref.componentId].supersets || [];
    if (index < 0 || index >= supersets.length)
      throw new BadRequestException('Superset index out of bounds');

    // remove superset
    supersets = supersets.filter((_, i) => i !== index);
    await this.trainingRepository.updateDoc(training.id, {
      [`components.${ref.componentId}.supersets`]: supersets,
    });

    return {
      ...training,
      components: {
        ...training.components,
        [ref.componentId]: {
          ...training.components[ref.componentId],
          supersets,
        },
      },
    };
  }

  async addExercises(
    ref: Required<TrainingSupersetRef>,
    input: [string, CreateTrainingExercise][], // [exerciseId, exercise][]
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is adding exercises to superset ${ref.superset} in component ${ref.componentId} for training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // find training component
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId))
      throw new BadRequestException('Training component not found');

    // check superset
    const supersets = training.components[ref.componentId].supersets || [];
    if (ref.superset < 0 || ref.superset >= supersets.length)
      throw new BadRequestException('Superset index out of bounds');

    // find all exercises
    const exerciseIds = input.map(([id]) => id);
    const exercises = await this.exerciseService.findAll(user, {
      filter: { ids: exerciseIds },
    });

    if (exercises.length !== exerciseIds.length)
      throw new BadRequestException('Some exercises are invalid');

    // validate exercises
    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      exercises,
    );

    if (error) throw new BadRequestException(message);

    // add exercises
    let order = Object.keys(supersets[ref.superset].exercises).length;
    supersets[ref.superset].exercises = {
      ...supersets[ref.superset].exercises,
      ...input
        .map(([id, data]) => ({
          [id]: {
            id,
            order: order++,
            color: data.color || this.commonService.color.random(),
            meta: { ...data.meta },
          },
        }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    // get data for all users (reads must be executed before writes for transactions)
    for (const exerciseId of exerciseIds) {
      // get data for all users
      const allUsersDataRaw = await Promise.all(
        training.membersIds.map(async (userId) => ({
          userId,
          data: await this.trainingWorkloadService.findAll({
            ...ref,
            exerciseId,
            userId,
          }),
        })),
      );

      const allUsersData = allUsersDataRaw.reduce(
        (acc, { userId, data }) => {
          acc[userId] = data;
          return acc;
        },
        {} as Record<string, TrainingWorkload[]>,
      );

      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          const docRef = this.trainingRepository.doc(training.id);
          transaction.update(docRef, {
            [`components.${ref.componentId}.supersets`]: supersets,
          });

          await Promise.all(
            input.map(([id, { meta }]) =>
              this.trainingWorkloadService.createMany(
                training,
                { ...ref, exerciseId: id },
                { meta },
                allUsersData,
                transaction,
              ),
            ),
          );
        },
      );
    }

    return {
      ...training,
      components: {
        ...training.components,
        [ref.componentId]: {
          ...training.components[ref.componentId],
          supersets,
        },
      },
    };
  }

  async updateExercise(
    ref: Required<TrainingExerciseRef>,
    input: Partial<UpdateTrainingExercise>,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating exercise ${ref.exerciseId} in superset ${ref.superset} for component ${ref.componentId} in training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // find training component
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId))
      throw new BadRequestException('Training component not found');

    // check superset
    const supersets = training.components[ref.componentId].supersets || [];
    if (ref.superset < 0 || ref.superset >= supersets.length)
      throw new BadRequestException('Superset index out of bounds');

    const superset = supersets[ref.superset];
    const exercises = superset.exercises || {};
    if (!exercises[ref.exerciseId])
      throw new BadRequestException('Exercise not found in superset');

    // update exercise
    const exercise = superset.exercises[ref.exerciseId];
    const currentOrder = exercise.order;
    const newOrder = input.order ?? currentOrder;

    // Validate new order
    const exerciseIds = Object.keys(exercises);
    if (newOrder < 0 || newOrder >= exerciseIds.length)
      throw new BadRequestException('New order index out of bounds');

    // Sort exercises by order
    const sortedExercises = exerciseIds
      .map((id) => ({ id, ...exercises[id] }))
      .sort((a, b) => a.order - b.order);

    // Remove the exercise being updated
    const filteredExercises = sortedExercises.filter(
      (e) => e.id !== ref.exerciseId,
    );

    // Insert the updated exercise at the new order position
    filteredExercises.splice(newOrder, 0, {
      id: exercise.id,
      color: input.color ?? exercise.color,
      order: newOrder,
      meta: { ...(input.meta ? input.meta : exercise.meta) },
    });

    // Reassign sequential order values to avoid duplicates
    const updatedExercises = filteredExercises.reduce(
      (acc, e, order) => {
        acc[e.id] = { ...e, order };
        return acc;
      },
      {} as Record<string, TrainingExercise>,
    );

    // get data for all users
    const allUsersDataRaw = await Promise.all(
      training.membersIds.map(async (userId) => ({
        userId,
        data: await this.trainingWorkloadService.findAll({ ...ref, userId }),
      })),
    );

    const allUsersData = allUsersDataRaw.reduce(
      (acc, { userId, data }) => {
        acc[userId] = data;
        return acc;
      },
      {} as Record<string, TrainingWorkload[]>,
    );

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      const docRef = this.trainingRepository.doc(training.id);

      // update training workload
      if (input.meta)
        await this.trainingWorkloadService.updateMany(
          training,
          ref,
          { meta: input.meta },
          allUsersData,
          transaction,
        );

      // update supersets
      supersets[ref.superset].exercises = updatedExercises;
      transaction.update(docRef, {
        [`components.${ref.componentId}.supersets`]: supersets,
      });
    });

    return {
      ...training,
      components: {
        ...training.components,
        [ref.componentId]: {
          ...training.components[ref.componentId],
          supersets,
        },
      },
    };
  }

  async deleteExercise(
    ref: Required<TrainingExerciseRef>,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is deleting exercise ${ref.exerciseId} from superset ${ref.superset} in component ${ref.componentId} for training ${ref.trainingId}`,
    );

    // find training component
    const training = await this.findOneOrFail(ref, { user });
    if (!Object.keys(training.components).includes(ref.componentId))
      throw new BadRequestException('Training component not found');

    // check superset
    const supersets = training.components[ref.componentId].supersets || [];
    if (ref.superset < 0 || ref.superset >= supersets.length)
      throw new BadRequestException('Superset index out of bounds');

    const exercises = supersets[ref.superset].exercises || {};
    if (!exercises[ref.exerciseId])
      throw new BadRequestException('Exercise not found in superset');

    // remove exercise
    const { [ref.exerciseId]: _, ...updatedExercises } = exercises;
    supersets[ref.superset].exercises = updatedExercises;

    await this.trainingRepository.updateDoc(training.id, {
      [`components.${ref.componentId}.supersets`]: supersets,
    });

    // TODO - keep user data for users that already completed the exercise

    return {
      ...training,
      components: {
        ...training.components,
        [ref.componentId]: {
          ...training.components[ref.componentId],
          supersets,
        },
      },
    };
  }

  map(training: Training): MappedTraining {
    return {
      ...training,
      components: Object.entries(training.components).map(
        ([componentId, component]) => ({
          id: componentId,
          color: component.color,
          order: component.order,
          supersets: component.supersets?.map((superset, i) => ({
            color: superset.color,
            order: i,
            componentId,
            exercises: Object.entries(superset.exercises).map(
              ([id, exercise]) => ({
                id,
                componentId,
                supersetId: i.toString(),
                order: exercise.order,
                color: exercise.color,
                meta: exercise.meta,
              }),
            ),
          })),
        }),
      ),
    };
  }

  private async addMembers(
    trainingIds: string[],
    membersIds: string[],
    options: { user: User },
  ) {
    this.logger.debug(
      `Adding members ${membersIds} to training ${trainingIds}`,
    );

    await Promise.all(
      trainingIds.map(async (trainingId) => {
        // add exercise data for new members
        await Promise.all(
          membersIds.map(async (memberId) => {
            await this.trainingWorkloadService.createByTraining(
              { trainingId },
              { memberId },
              options,
            );
          }),
        );

        // update training members
        await this.trainingRepository.updateDoc(trainingId, { membersIds });
      }),
    );
  }

  private async removeMembers(trainingIds: string[], membersIds: string[]) {
    this.logger.debug(
      `Removing members ${membersIds} from training ${trainingIds}`,
    );

    // only remove members from trainings, keep training data
    await Promise.all(
      trainingIds.map((trainingId) =>
        this.trainingRepository.updateDoc(trainingId, { membersIds }),
      ),
    );
  }

  private filter(query: Query, filter: Filter<Training>) {
    if (filter.ids?.length)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.groupId)
      query = query.where(
        'groupId',
        filter.groupId?.op || '==',
        filter.groupId.value,
      );

    if (filter.cycleId)
      query = query.where('cycleId', '==', filter.cycleId.value);

    if (filter.ownerId)
      query = query.where('ownerId', '==', filter.ownerId.value);

    if (filter.membersIds)
      query = query.where(
        'membersIds',
        'array-contains',
        filter.membersIds.value,
      );

    if (filter.subgroupId)
      query = query.where(
        'subgroupId',
        filter.subgroupId.op || '==',
        filter.subgroupId.value,
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

  private paginate(query: Query, paginate: PaginateOptions<Training>) {
    const orderBy = paginate.orderBy || { field: 'from', value: 'asc' };
    const page = paginate.page || 1;
    const pageSize = paginate.pageSize || DEFAULT_PAGE_SIZE;

    return query
      .orderBy(orderBy.field, orderBy.value)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }

  private async validateSubgroup(ref: Required<SubgroupRef>): Promise<void> {
    if (ref.subgroupId) {
      const subgroup = await this.subgroupService.findOne({
        groupId: ref.groupId,
        subgroupId: ref.subgroupId,
      });

      if (!subgroup) throw new BadRequestException('Subgroup does not exist');
    }
  }

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

  private validateOwner(userId: string, group: Group) {
    if (!this.groupService.isOwner(userId, group))
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

  private async validateOverlap(
    groupId: string,
    from: Date,
    to: Date,
    trainingId?: string, // exclude training with this id
  ): Promise<void> {
    const trainings = await this.findAll({
      filter: { groupId: { value: groupId } },
    });

    const isOverlap = trainings
      .filter((training) => training.id !== trainingId)
      .some(
        (training) =>
          (isBefore(from, training.from) && isAfter(to, training.to)) ||
          (isAfter(from, training.from) && isBefore(to, training.to)) ||
          (isBefore(from, training.to) && isAfter(to, training.from)) ||
          (isAfter(from, training.from) && isBefore(to, training.to)),
      );

    if (isOverlap)
      throw new BadRequestException('Training overlaps with other training');
  }

  private async validateTrainingExercises(
    ref: Required<TrainingComponentRef>,
    exerciseIds: string[],
    user: User,
  ): Promise<void> {
    if (!exerciseIds.length) return;

    const exercises = await this.exerciseService.findAll(user, {
      filter: { ids: exerciseIds },
    });

    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      exercises,
    );

    if (error) throw new BadRequestException(message);
  }

  private validateAvailableMembersIds(
    availableMembersIds: string[],
    membersIds: string[],
  ): void {
    if (!availableMembersIds.length)
      throw new BadRequestException('No members are available');

    const invalidMembersIds = membersIds.filter(
      (memberId) => !availableMembersIds.includes(memberId),
    );

    if (invalidMembersIds.length)
      throw new BadRequestException(`Some members are not available`);
  }
}
