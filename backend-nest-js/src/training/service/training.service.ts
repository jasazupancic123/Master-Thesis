import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { FieldPath, Query, Timestamp } from 'firebase-admin/firestore';
import { Training } from '../entity/training.entity';
import { ComponentService } from '../../component/component.service';
import { ExerciseService } from '../../exercise/service/exercise.service';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { GroupService } from '../../group/service/group.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { TrainingRepository } from '../repository/training.repository';
import { TrainingComponentRepository } from '../repository/training-component.repository';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { TrainingComponentService } from './training-component.service';
import {
  SubgroupRef,
  TrainingRef,
} from '../../common/type/firebase-firestore.type';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { SubgroupService } from '../../group/service/subgroup.service';
import { TrainingSupersetRepository } from '../repository/training-superset.repository';
import { CreateTraining, UpdateTraining } from '../type/training.type';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Group } from '../../group/entity/group.entity';
import { TrainingExerciseUserDataService } from './training-exercise-user-data.service';
import { isAfter, isBefore } from 'date-fns';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingComponentRepository: TrainingComponentRepository,
    private readonly trainingSupersetRepository: TrainingSupersetRepository,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => SubgroupService))
    private readonly subgroupService: Wrapper<SubgroupService>,
    private readonly trainingComponentService: TrainingComponentService,
    private readonly trainingExerciseUserDataService: TrainingExerciseUserDataService,
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

    // populate training
    if (options?.populate) await this.populate(ref, training, options.populate);

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
      if (this.firebaseService.isTrainer(options.user))
        filter.ownerId = { value: options.user.uid };

      if (this.firebaseService.isAthlete(options.user))
        filter.membersIds = { value: options.user.uid };
    }

    let trainings = await this.trainingRepository.getDocs((collection) => {
      let query = this.filter(collection, filter);
      if (options?.paginate) query = this.paginate(query, options.paginate);
      query = query.where('deletedAt', '==', null).orderBy('from', 'asc');
      return query;
    });

    if (options?.populate)
      await Promise.all(
        trainings.map(async (training) => {
          const trainingRef = { trainingId: training.id };
          await this.populate(trainingRef, training, options.populate);
        }),
      );

    return trainings;
  }

  async create(
    input: CreateTraining,
    options: { user: User },
  ): Promise<Training> {
    const { user } = options;
    this.logger.debug(
      `Creating training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    const group = await this.groupService.findOneOrFail(
      { groupId: input.groupId },
      { user, populate: ['availableMembersIds'] },
    );

    // validate data
    this.validateTime(input.from, input.to);
    await this.validateTrainer(user);
    await this.validateOwner(user.uid, group);
    await this.validateComponents(input.componentIds);
    await this.validateOverlap(group.id, input.from, input.to);
    await this.validateSubgroup({
      groupId: group.id,
      subgroupId: input.subgroupId,
    });

    // create training
    const trainingId = await this.trainingRepository.addDoc({
      groupId: group.id,
      ownerId: user.uid,
      cycleId: input.cycleId,
      membersIds: group.membersIds,
      subgroupId: input.subgroupId || null,
      from: input.from,
      to: input.to,
    });

    const training = await this.findOneOrFail({ trainingId }, { user });
    training.components = await this.trainingComponentService.createMany(
      { trainingId },
      input.componentIds.map((componentId) => ({ componentId })),
      options,
    );

    return training;
  }

  async copy(
    source: { trainingId: string },
    destination: {
      groupId: string;
      cycleId: string;
      subgroupId: string | null;
    },
    options: { user: User },
  ): Promise<Training> {
    const { user } = options;
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
    };
  }

  async update(
    ref: Required<TrainingRef>,
    input: UpdateTraining,
    options: { user: User },
  ): Promise<Training> {
    this.logger.debug(
      `Updating training ${ref.trainingId} (user ${options.user.uid}): ${JSON.stringify(
        input,
      )}`,
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

  async remove(
    ref: Required<TrainingRef>,
    options: { user: User },
  ): Promise<void> {
    const { user } = options;
    this.logger.debug(`Removing training ${ref.trainingId} (user ${user.uid})`);
    const training = await this.findOneOrFail(ref, {
      ...options,
      populate: ['components'],
    });

    // delete training components
    await Promise.all(
      training.components.map(({ componentId }) =>
        this.trainingComponentService.remove({ ...ref, componentId }, options),
      ),
    );

    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  private async validateComponents(componentsIds: string[]): Promise<void> {
    const components = await this.componentService.findAllTree({
      filter: {
        ...(componentsIds.length > 0 && { ids: componentsIds }),
      },
    });

    for (const component of components)
      if (component.parent)
        throw new BadRequestException(`Component ${component.id} is not root`);

    if (components.length !== componentsIds.length)
      throw new BadRequestException('Some components do not exist');
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
            await this.trainingExerciseUserDataService.createByTraining(
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
      query = query.where('groupId', '==', filter.groupId.value);

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

  private async populate(
    ref: Required<TrainingRef>,
    training: Training,
    populate: Populate<Training>[],
  ) {
    if (populate.includes('components')) {
      training.components = await this.trainingComponentRepository.getDocs(ref);

      if (populate.includes('components.component')) {
        await Promise.all(
          training.components.map(async (component) => {
            component.component =
              await this.componentService.findOneBySlugOrFail(
                component.componentId,
              );
          }),
        );
      }

      if (populate.includes('components.supersets')) {
        await Promise.all(
          training.components.map(async (component) => {
            const componentRef = {
              ...ref,
              componentId: component.componentId,
            };

            component.supersets =
              await this.trainingSupersetRepository.getDocs(componentRef);

            if (populate.includes('components.supersets.exercises'))
              await Promise.all(
                component.supersets.map(async (superset) => {
                  const supersetRef = {
                    ...ref,
                    componentId: component.componentId,
                    supersetId: superset.id,
                  };

                  superset.exercises =
                    await this.trainingExerciseRepository.getDocs(supersetRef);

                  if (
                    populate.includes('components.supersets.exercises.exercise')
                  )
                    await Promise.all(
                      superset.exercises.map(async (exercise) => {
                        exercise.exercise = await this.exerciseService.findOne({
                          ...ref,
                          exerciseId: exercise.exerciseId,
                        });
                      }),
                    );

                  if (
                    populate.includes('components.supersets.exercises.data')
                  ) {
                    // TODO: populate exercise data
                  }
                }),
              );
          }),
        );
      }
    }

    if (populate.includes('subgroup') && training.subgroupId)
      training.subgroup = await this.subgroupService.findOne({
        ...ref,
        groupId: training.groupId,
        subgroupId: training.subgroupId,
      });
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

  private async validateTrainer(user: User): Promise<void> {
    if (!this.firebaseService.isTrainer(user))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private async validateOwner(userId: string, group: Group): Promise<void> {
    if (!this.groupService.isOwner(userId, group))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
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
      .some((training) => {
        if (isBefore(from, training.from) && isAfter(to, training.to))
          return true;
        if (isAfter(from, training.from) && isBefore(to, training.to))
          return true;
        if (isBefore(from, training.to) && isAfter(to, training.from))
          return true;
        if (isAfter(from, training.from) && isBefore(to, training.to))
          return true;
        // else
        return false;
      });

    if (isOverlap)
      throw new BadRequestException('Training overlaps with other training');
  }

  private validateTime(from: Date, to: Date) {
    if (from >= to) throw new BadRequestException('Invalid training time');
  }

  private isAuthorized(user: User, training: Training): boolean {
    return (
      training.ownerId === user.uid || training.membersIds.includes(user.uid)
    );
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
