import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { FieldPath, Query } from 'firebase-admin/firestore';
import { NUM_MAX_GROUPS } from 'src/common/constant/limit.constant';
import { Create, Update } from 'src/common/type/entity.type';
import { Training } from 'src/training/entity/training.entity';
import { CommonService } from '../common/service/common.service';
import { User } from '../common/type/firebase-auth.type';
import { GroupRef } from '../common/type/firestore.type';
import { Wrapper } from '../common/type/wrapper.type';
import { FirebaseService } from '../firebase/firebase.service';
import { Subgroup } from '../training/entity/subgroup.entity';
import { TrainingService } from '../training/service/training.service';
import { UserService } from '../user/user.service';
import { Cycle } from './entity/cycle.entity';
import { Group } from './entity/group.entity';
import { GroupRepository } from './repository/group.repository';

@Injectable()
export class GroupService {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  isAuthorized(user: User, group: Group): boolean {
    return this.isMember(user.uid, group) || this.isOwner(user.uid, group);
  }

  isMember(userId: string, group: Group | Subgroup): boolean {
    return group.membersIds.includes(userId);
  }

  isOwner(userId: string, groupOrTraining: Group | Training): boolean {
    return groupOrTraining.ownerId === userId;
  }

  async findAll(user: User): Promise<Group[]> {
    const groups = await this.groupRepository.getDocs((collection) => {
      return this.firebaseService.isTrainer(user)
        ? collection.where('ownerId', '==', user.uid)
        : this.firebaseService.isAthlete(user)
          ? collection.where('membersIds', 'array-contains', user.uid)
          : collection;
    });

    return groups;
  }

  async findById(user: User, ref: GroupRef): Promise<Group | null> {
    // find group
    const group = await this.groupRepository.getDoc(ref.groupId);
    if (!group || group.deletedAt) return null;

    // authorize
    if (!this.isAuthorized(user, group)) return null;
    return group;
  }

  async findByIdOrFail(user: User, ref: GroupRef): Promise<Group> {
    const group = await this.findById(user, ref);
    if (!group) throw new BadRequestException('Group not found');
    return group;
  }

  async create(
    user: User,
    input: Create<Group, 'name' | 'membersIds'>,
  ): Promise<Group> {
    this.logger.log(
      `User ${user.uid} is creating group: ${JSON.stringify(input)}`,
    );

    // validate
    await this.validateMembers(input.membersIds);
    await this.checkLimit(user.uid);

    let groupId: string;
    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // add group
      const docRef = this.groupRepository.collection().doc();
      groupId = docRef.id;

      const query = this.firebaseService.buildCreateQuery<Group>(
        {
          id: groupId,
          name: input.name,
          ownerId: user.uid,
          membersIds: input.membersIds,
          cycles: [],
        },
        { timestamps: true },
      );

      transaction.set(docRef, query);

      // add group to all members and trainer
      [...input.membersIds, user.uid].map((userId) =>
        this.userService.addGroup(transaction, userId, groupId),
      );
    });

    return {
      id: groupId,
      name: input.name,
      ownerId: user.uid,
      membersIds: input.membersIds,
      cycles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(
    user: User,
    ref: GroupRef,
    input: Update<Group, 'name' | 'membersIds' | 'cycles'>,
  ): Promise<Group> {
    this.logger.log(
      `User ${user.uid} is updating group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    const group = await this.findByIdOrFail(user, ref);

    // validate
    this.validateOwner(user.uid, group);
    if (input.membersIds) await this.validateMembers(input.membersIds);
    if (input.cycles) this.checkCycleOverlap(input.cycles);

    if (input.membersIds) {
      // update trainings and members' groups array in transaction
      const trainingDocs = await this.trainingService.getDocs((query) =>
        query.where('groupId', '==', ref.groupId),
      );

      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          // update all trainings from the group by updating their members
          trainingDocs.forEach((doc) => {
            transaction.update(doc.ref, { membersIds: input.membersIds });
          });

          // update all members by adding group id to their groupsIds field if it doesn't exist yet
          input.membersIds.forEach((userId) =>
            this.userService.addGroup(transaction, userId, group.id),
          );

          // TODO - add new user meta to all trainings in the future

          // TODO - calculate new workloads for all trainings in the future

          const docRef = this.groupRepository.doc(ref.groupId);
          const query = this.firebaseService.buildUpdateQuery<Group>({
            ...input,
            cycles: input.cycles?.map((c) => {
              const { weeks, ...cycle } = c;
              return cycle as Cycle;
            }),
          });

          transaction.update(docRef, query);
        },
      );
    }
    // update other fields in a single query
    else await this.groupRepository.updateDoc(ref.groupId, input);

    const updatedGroup = {
      ...group,
      ...this.commonService.object.clean(input),
    };

    updatedGroup.cycles = updatedGroup.cycles
      .map((c) => ({
        ...c,
        weeks: this.commonService.date.weeks(c.from, c.to),
      }))
      .sort((a, b) => a.from.getMilliseconds() - b.from.getMilliseconds());

    return updatedGroup;
  }

  async delete(user: User, ref: GroupRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing group ${ref.groupId}`);

    const group = await this.findByIdOrFail(user, ref);
    this.validateOwner(user.uid, group);

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // remove group from all members and owner
      [...group.membersIds, user.uid].forEach((userId) =>
        this.userService.removeGroup(transaction, userId, group.id),
      );

      // delete group
      const docRef = this.groupRepository.doc(group.id);
      transaction.delete(docRef);
    });
  }

  findCycle(cycleId: string, group: Group) {
    return group.cycles.find((cycle) => cycle.id === cycleId);
  }

  findCycleOrFail(cycleId: string, group: Group) {
    const cycle = this.findCycle(cycleId, group);
    if (!cycle) throw new BadRequestException('Cycle does not exist');
    return cycle;
  }

  private checkCycleOverlap(cycles: Cycle[]) {
    for (let i = 0; i < cycles.length; i++) {
      for (let j = i + 1; j < cycles.length; j++) {
        const a = cycles[i];
        const b = cycles[j];

        const overlap = this.commonService.date.isBetween(a.from, b.from, b.to);
        if (overlap)
          throw new ConflictException(
            `Cycle "${a.name}" overlaps with cycle "${b.name}"`,
          );
      }
    }
  }

  private validateOwner(userId: string, groupOrTraining: Group | Training) {
    if (!this.isOwner(userId, groupOrTraining))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private async validateMembers(membersIds: string[]) {
    const members = await this.userService.findAllOrFail({ ids: membersIds });

    if (members.length < 1)
      throw new BadRequestException('Group must have at least one member');

    if (members.length !== membersIds.length)
      throw new BadRequestException('Invalid members provided');

    return members;
  }

  private async checkLimit(userId: string) {
    const user = await this.userService.findOneOrFail(userId);
    if (user.groupsIds.length === NUM_MAX_GROUPS - 1)
      throw new ConflictException('Group limit reached');
  }
}
