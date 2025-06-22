import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Create } from '../common/type/entity.type';
import { CommonService } from '../common/service/common.service';
import { User } from '../common/type/firebase-auth.type';
import { GroupRef, InstitutionRef } from '../common/type/firestore.type';
import { Wrapper } from '../common/type/wrapper.type';
import { FirebaseService } from '../firebase/firebase.service';
import { TrainingService } from '../training/service/training.service';
import { UserService } from '../user/user.service';
import { Cycle } from './entity/cycle.entity';
import { Group } from './entity/group.entity';
import { GroupRepository } from './repository/group.repository';
import { InstitutionService } from '../institution/service/institution.service';
import { Institution } from '../institution/entity/institution.entity';
import { WriteBatch } from 'firebase-admin/firestore';
import { Permission } from '../common/interface/permission.interface';
import { CreateGroupDto } from './dto/create-group.dto';
import { BatchUpdateOneGroupDto, UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService implements Permission<Group, Institution> {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {}

  async findAll(user: User): Promise<Group[]> {
    return await this.groupRepository.getDocs((q) => {
      return this.firebaseService.isTrainer(user)
        ? q.where('ownerId', '==', user.uid)
        : this.firebaseService.isAthlete(user)
          ? q.where('membersIds', 'array-contains', user.uid)
          : q;
    });
  }

  async findOneById(user: User, ref: GroupRef): Promise<Group | null> {
    // find group
    const group = await this.groupRepository.getDoc(ref.groupId);
    if (!group || group.deletedAt) return null;

    // authorize
    group.institution = await this.institutionService.getDocByIdOrFail(group);
    if (!this.canView(user, group, group.institution))
      throw new UnauthorizedException('You are not allowed to view this group');

    return group;
  }

  async findOneByIdOrFail(user: User, ref: GroupRef): Promise<Group> {
    const group = await this.findOneById(user, ref);
    if (!group) throw new NotFoundException('Group does not exist');
    return group;
  }

  async findAllByInstitution(
    user: User,
    ref: InstitutionRef,
  ): Promise<Group[]> {
    const institution = await this.institutionService.getDocByIdOrFail(ref);
    if (!this.institutionService.canView(user, institution))
      throw new UnauthorizedException(
        'You are not allowed to view this institution',
      );

    return await this.groupRepository.getDocs((q) =>
      q.where('institutionId', '==', ref.institutionId),
    );
  }

  async create(user: User, input: CreateGroupDto): Promise<Group> {
    const { name, membersIds, institutionId, ownerId } = input;
    this.logger.log(
      `User ${user.uid} is creating group: ${JSON.stringify(input)}`,
    );

    // validate
    const institution = await this.institutionService.getDocByIdOrFail(input);
    await this.userService.findAllOrFail({ ids: membersIds });
    if (!this.institutionService.canEdit(user, institution))
      throw new UnauthorizedException(
        'You are not allowed to create group in this institution',
      );

    const data: Create<Group> = {
      id: null,
      name,
      ownerId,
      membersIds,
      institutionId,
      cycles: [],
    };

    const groupId = await this.groupRepository.addDoc(data);
    return {
      ...data,
      id: groupId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Group;
  }

  async update(
    user: User,
    ref: GroupRef,
    input: UpdateGroupDto,
  ): Promise<Group> {
    this.logger.log(
      `User ${user.uid} is updating group: ${JSON.stringify(input)}`,
    );

    // validate
    const group = await this.findOneByIdOrFail(user, ref);
    const institution = await this.institutionService.getDocByIdOrFail(group);
    if (!this.canEdit(user, group, institution))
      throw new UnauthorizedException('You are not allowed to edit this group');

    // validate members
    if (input.membersIds)
      await this.userService.findAllOrFail({ ids: input.membersIds });

    // validate cycles
    if (input.cycles)
      if (this.isCycleOverlap(input.cycles))
        throw new BadRequestException('Cycles overlap');

    // validate owner
    if (input.ownerId)
      if (
        !this.firebaseService.isInstitution(user) ||
        institution.ownerId !== user.uid
      )
        throw new UnauthorizedException('You are not allowed to update owner');

    const batch = this.firebaseService.firestore.batch();
    await this.batchUpdateOne(batch, { ...input, id: ref.groupId });
    await batch.commit();

    const updated = { ...group, ...this.commonService.object.clean(input) };
    updated.cycles = updated.cycles
      .map((c) => ({
        ...c,
        weeks: this.commonService.date.weeks(c.from, c.to),
      }))
      .sort((a, b) => a.from.getMilliseconds() - b.from.getMilliseconds());

    return { ...updated, id: ref.groupId };
  }

  async batchUpdate(user: User, input: BatchUpdateOneGroupDto[]) {
    this.logger.log(
      `User ${user.uid} is updating multiple groups: ${input.length}`,
    );

    // validate
    const group = await this.findOneByIdOrFail(user, { groupId: input[0]?.id });
    const institution = await this.institutionService.getDocByIdOrFail(group);
    if (!this.canEdit(user, group, institution))
      throw new UnauthorizedException('You are not allowed to edit this group');

    // validate members
    const allMembersIds = input.flatMap((i) => i.membersIds || []);
    await this.userService.findAllOrFail({ ids: allMembersIds });

    // validate cycles
    for (const group of input)
      if (group.cycles) this.isCycleOverlap(group.cycles);

    const batch = this.firebaseService.firestore.batch();
    await Promise.all(input.map((group) => this.batchUpdateOne(batch, group)));
    await batch.commit();
  }

  private async batchUpdateOne(
    batch: WriteBatch,
    input: BatchUpdateOneGroupDto,
  ) {
    const docRef = this.groupRepository.doc(input.id);
    if (input.membersIds) {
      const trainingDocs = await this.trainingService.getDocs((query) =>
        query.where('groupId', '==', input.id),
      );

      // update all trainings' members
      trainingDocs.forEach((doc) => {
        batch.update(doc.ref, { membersIds: input.membersIds });
      });

      // TODO - add new user meta to all trainings in the future
      // TODO - calculate new workloads for all trainings in the future
    }

    batch.update(
      docRef,
      this.firebaseService.buildUpdateQuery<Group>({
        ...input,
        cycles: input.cycles?.map((c) => {
          const { weeks, ...cycle } = c;
          return cycle;
        }),
      }),
    );
  }

  async delete(user: User, ref: GroupRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing group ${ref.groupId}`);

    const group = await this.findOneByIdOrFail(user, ref);
    const institution = await this.institutionService.getDocByIdOrFail(group);
    this.canEdit(user, group, institution);

    await this.groupRepository.deleteDoc(group.id);
  }

  findCycle(cycleId: string, group: Group) {
    return group.cycles.find((cycle) => cycle.id === cycleId);
  }

  findCycleOrFail(cycleId: string, group: Group) {
    const cycle = this.findCycle(cycleId, group);
    if (!cycle) throw new NotFoundException('Cycle does not exist');
    return cycle;
  }

  private isCycleOverlap(cycles: Cycle[]): boolean {
    if (!cycles || cycles.length < 2) return false;

    const sortedCycles = [...cycles].sort(
      (a, b) => a.from.getTime() - b.from.getTime(),
    );

    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const current = sortedCycles[i];
      const next = sortedCycles[i + 1];
      if (current.to > next.from) return true;
    }

    return false;
  }

  canView(user: User, group: Group, institution?: Institution) {
    if (group.membersIds.includes(user.uid)) return true; // athlete is member
    if (group.ownerId === user.uid) return true; // trainer is owner

    if (institution) {
      if (institution.ownerId === user.uid) return true; // institution owner

      // other institution members can view other groups
      if (
        institution.athleteIds.includes(user.uid) ||
        institution.trainerIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }

  canEdit(user: User, group: Group, institution: Institution) {
    if (this.firebaseService.isTrainer(user) && group.ownerId === user.uid)
      return true; // owner of the group (trainer) can edit group

    if (
      this.firebaseService.isInstitution(user) &&
      institution.ownerId === user.uid
    )
      // manager can edit all groups
      return true;

    return false;
  }
}
