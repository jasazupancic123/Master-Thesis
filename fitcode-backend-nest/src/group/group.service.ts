import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { NUM_MAX_GROUPS } from '../common/constant/limit.constant';
import { Create, FirestoreEntity, Update } from '../common/type/entity.type';
import { Training } from '../training/entity/training.entity';
import { CommonService } from '../common/service/common.service';
import { User } from '../common/type/firebase-auth.type';
import { GroupRef, InstitutionRef } from '../common/type/firestore.type';
import { Wrapper } from '../common/type/wrapper.type';
import { FirebaseService } from '../firebase/firebase.service';
import { Subgroup } from '../training/entity/subgroup.entity';
import { TrainingService } from '../training/service/training.service';
import { UserService } from '../user/user.service';
import { Cycle } from './entity/cycle.entity';
import { Group } from './entity/group.entity';
import { GroupRepository } from './repository/group.repository';
import { UserEntity } from '../user/entity/user.entity';
import { InstitutionService } from '../institution/service/institution.service';
import { Institution } from '../institution/entity/institution.entity';
import { UserRole } from 'src/user/enum/user-role.enum';

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
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
  ) {}

  async isAuthorized(user: User, group: Group) {
    if (
      !this.isMember(user.uid, group) &&
      !(await this.isTrainer(user.uid, group)) &&
      !this.isOwner(user.uid, group)
    )
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  async isTrainer(userId: string, group: Group): Promise<boolean> {
    const trainers = await this.userService.getDocs((query) =>
      query.where('id', '==', userId),
    );
    if (trainers.length !== 1) return false;
    const trainer = trainers[0];

    return trainer.groupsIds.includes(group.id);
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
    await this.isAuthorized(user, group);

    return group;
  }

  async findByIdOrFail(user: User, ref: GroupRef): Promise<Group> {
    const group = await this.findById(user, ref);
    if (!group) throw new NotFoundException('Group does not exist');
    return group;
  }

  async findMembers(user: User, ref: GroupRef): Promise<UserEntity[]> {
    const group = await this.findByIdOrFail(user, ref);
    this.validateOwner(user, group);

    return await this.userService.getDocs((q) =>
      q.where('id', 'in', group.membersIds),
    );
  }

  async findAllByInstitution(
    user: User,
    ref: InstitutionRef,
  ): Promise<Group[]> {
    const institution = await this.institutionService.findOneOrFail(ref);
    if (!institution) return [];

    if (
      institution.ownerId !== user.uid &&
      !institution.trainerIds.includes(user.uid) &&
      !user.customClaims.role.includes(UserRole.ADMIN)
    )
      throw new UnauthorizedException(
        'You are not authorized to view groups of this institution',
      );

    const groupIds = institution.groupIds;
    if (!groupIds || !groupIds.length) return [];

    const groups = await this.groupRepository.getDocs((q) =>
      q.where('id', 'in', groupIds),
    );

    return groups;
  }

  async create(
    user: User,
    input: Create<Group, 'name' | 'membersIds' | 'institutionId'>,
  ): Promise<Group> {
    const { name, membersIds, institutionId } = input;
    this.logger.log(
      `User ${user.uid} is creating group: ${JSON.stringify(input)}`,
    );

    // validate
    await this.validateMembers(membersIds);
    await this.checkLimit(user.uid);

    const institution = await this.institutionService.findOneOrFail({
      institutionId,
    });

    let groupId: string;
    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // add group
      const docRef = this.groupRepository.collection().doc();
      groupId = docRef.id;

      const query = this.firebaseService.buildCreateQuery<Group>(
        {
          id: groupId,
          name: name,
          ownerId: user.uid,
          membersIds: membersIds,
          institutionId: institutionId,
          cycles: [],
        },
        { timestamps: true },
      );

      transaction.set(docRef, query);

      // add group to all members and trainer
      [...membersIds, user.uid].map((userId) =>
        this.userService.addGroup(transaction, userId, groupId),
      );
    });

    // add group to institution
    institution.groupIds.push(groupId);
    await this.institutionService.update(
      user,
      { institutionId: institution.id },
      { groupIds: institution.groupIds },
    );

    return {
      id: groupId,
      name: name,
      ownerId: user.uid,
      membersIds: membersIds,
      institutionId: institutionId,
      cycles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Group;
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
    this.validateOwner(user, group);
    if (input.membersIds)
      await this.validateMembers(input.membersIds as string[]);
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
          (input.membersIds as string[]).forEach((userId) =>
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

    return updatedGroup as Group;
  }

  async updateMultiple(
    user: User,
    input: Update<Group, 'id' | 'name' | 'membersIds' | 'cycles'>[],
  ): Promise<Group[]> {
    this.logger.log(
      `User ${user.uid} is updating multiple groups: ${JSON.stringify(input)}`,
    );

    const updatedGroups: Group[] = [];
    let updateInstitution = false;
    for (const i of input) {
      const ref: GroupRef = { groupId: i.id };
      const group = await this.findByIdOrFail(user, ref);

      // athletes in group might miss in institution, also add them to institution if yes
      const institutions = await this.institutionService
        .getDocs((q) => q.where('groupIds', 'array-contains', group.id))
        .then(({ docs }) =>
          docs.map((doc) =>
            this.firebaseService.serialize(
              doc.data() as FirestoreEntity<Institution>,
            ),
          ),
        );

      if (institutions.length !== 1)
        throw new ConflictException('Group is not in exactly one institution');

      const instituion = institutions[0];

      group.membersIds.map((userId) => {
        if (!instituion.athleteIds.includes(userId)) {
          updateInstitution = true;
          instituion.athleteIds.push(userId);
        }
      });

      // validate
      this.validateOwner(user, group);
      if (i.membersIds) await this.validateMembers(i.membersIds as string[]);
      if (i.cycles) this.checkCycleOverlap(i.cycles);

      if (i.membersIds) {
        // update trainings and members' groups array in transaction
        const trainingDocs = await this.trainingService.getDocs((query) =>
          query.where('groupId', '==', ref.groupId),
        );

        await this.firebaseService.firestore.runTransaction(
          async (transaction) => {
            // update all trainings from the group by updating their members
            trainingDocs.forEach((doc) => {
              transaction.update(doc.ref, { membersIds: i.membersIds });
            });

            // update all members by adding group id to their groupsIds field if it doesn't exist yet
            (i.membersIds as string[]).forEach((userId) =>
              this.userService.addGroup(transaction, userId, group.id),
            );

            // TODO - add new user meta to all trainings in the future

            // TODO - calculate new workloads for all trainings in the future

            const docRef = this.groupRepository.doc(ref.groupId);
            const query = this.firebaseService.buildUpdateQuery<Group>({
              ...i,
              cycles: i.cycles?.map((c) => {
                const { weeks, ...cycle } = c;
                return cycle as Cycle;
              }),
            });

            transaction.update(docRef, query);
          },
        );
      }
      // update other fields in a single query
      else await this.groupRepository.updateDoc(ref.groupId, i);

      const updatedGroup = {
        ...group,
        ...this.commonService.object.clean(i),
      };

      updatedGroup.cycles = updatedGroup.cycles
        .map((c) => ({
          ...c,
          weeks: this.commonService.date.weeks(c.from, c.to),
        }))
        .sort((a, b) => a.from.getMilliseconds() - b.from.getMilliseconds());

      updatedGroups.push(updatedGroup as Group);

      if (updateInstitution) {
        await this.institutionService.update(
          user,
          { institutionId: instituion.id },
          { athleteIds: instituion.athleteIds },
        );
      }
    }

    return updatedGroups;
  }

  async delete(user: User, ref: GroupRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing group ${ref.groupId}`);

    const group = await this.findByIdOrFail(user, ref);
    this.validateOwner(user, group);

    // remove group from institution
    const institutions = await this.institutionService
      .getDocs((q) => q.where('groupIds', 'array-contains', group.id))
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<Institution>,
          ),
        ),
      );

    if (institutions.length !== 1)
      throw new ConflictException('Group is not in exactly one institution');

    const institution = institutions[0];
    institution.groupIds = institution.groupIds.filter((id) => id !== group.id);

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // remove group from all members and owner
      [...group.membersIds, user.uid].forEach((userId) =>
        this.userService.removeGroup(transaction, userId, group.id),
      );

      // delete group
      const docRef = this.groupRepository.doc(group.id);
      transaction.delete(docRef);
    });

    // institution transaction
    await this.institutionService.update(
      user,
      { institutionId: institution.id },
      { groupIds: institution.groupIds },
    );
  }

  findCycle(cycleId: string, group: Group) {
    return group.cycles.find((cycle) => cycle.id === cycleId);
  }

  findCycleOrFail(cycleId: string, group: Group) {
    const cycle = this.findCycle(cycleId, group);
    if (!cycle) throw new NotFoundException('Cycle does not exist');
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

  private validateOwner(user: User, groupOrTraining: Group | Training) {
    if (!this.isOwner(user.uid, groupOrTraining))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private async validateMembers(membersIds: string[]) {
    if (membersIds.length === 0) return [];

    const members = await this.userService.findAllOrFail({ ids: membersIds });
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
