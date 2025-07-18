import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { WriteBatch } from 'firebase-admin/firestore';

import { LogMethod } from '../common/decorator/log-method.decorator';
import { Permission } from '../common/interface/permission.interface';
import { CommonService } from '../common/service/common.service';
import { Create } from '../common/type/entity.type';
import { User } from '../common/type/firebase-auth.type';
import { GroupRef, InstitutionRef } from '../common/type/firestore.type';
import { Wrapper } from '../common/type/wrapper.type';
import { FirebaseService } from '../firebase/firebase.service';
import { Institution } from '../institution/entity/institution.entity';
import { InstitutionService } from '../institution/service/institution.service';
import { TrainingService } from '../training/service/training.service';
import { UserService } from '../user/user.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { BatchUpdateOneGroupDto, UpdateGroupDto } from './dto/update-group.dto';
import { Cycle } from './entity/cycle.entity';
import { Group } from './entity/group.entity';
import { GroupRepository } from './repository/group.repository';

@Injectable()
export class GroupService implements Permission<Group, Institution> {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly repository: GroupRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {}

  async findAll(user: User): Promise<Group[]> {
    return await this.repository.getDocs((q) => {
      return this.firebaseService.isTrainer(user)
        ? q.where('ownerId', '==', user.uid)
        : this.firebaseService.isAthlete(user)
          ? q.where('membersIds', 'array-contains', user.uid)
          : q;
    });
  }

  async findOneById(user: User, ref: GroupRef): Promise<Group | null> {
    // find group
    const group = await this.repository.getDoc(ref.groupId);
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

    return await this.repository.getDocs((q) =>
      q.where('institutionId', '==', ref.institutionId),
    );
  }

  @LogMethod()
  async create(user: User, input: CreateGroupDto): Promise<Group> {
    const { name, membersIds, institutionId, ownerId } = input;

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

    const groupId = await this.repository.addDoc(data);
    return {
      ...data,
      id: groupId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Group;
  }

  @LogMethod()
  async update(
    user: User,
    ref: GroupRef,
    input: UpdateGroupDto,
  ): Promise<Group> {
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
        !this.firebaseService.isManager(user) ||
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
    const groups = await this.validateBatch(input);

    // NOTE - trainer and manager can always edit all groups in the institution,
    // so this check is unnecessary, but still here
    for (const group of groups)
      if (!this.canEdit(user, group, group.institution!))
        throw new UnauthorizedException(
          `You are not allowed to edit group ${group.name}`,
        );

    // validate members
    const allMembersIds = input.flatMap((i) => i.membersIds || []);
    const _members = await this.userService.findAllOrFail({
      ids: allMembersIds,
    });

    // for (const group of groups)
    //   this.validateMembersInInstitution(members, group.institution);

    // validate cycles
    for (const group of input)
      if (group.cycles)
        if (this.isCycleOverlap(group.cycles))
          throw new BadRequestException(
            `Cycles in group ${group.name} cannot overlap`,
          );

    const batch = this.firebaseService.firestore.batch();
    await Promise.all(input.map((group) => this.batchUpdateOne(batch, group)));
    await batch.commit();
  }

  private async batchUpdateOne(
    batch: WriteBatch,
    input: BatchUpdateOneGroupDto,
  ) {
    const docRef = this.repository.doc(input.id);
    if (input.membersIds) {
      const trainingDocs = await this.trainingService.getDocs((q) =>
        q
          .where('groupId', '==', input.id)
          .where('from', '>=', startOfDay(new Date())),
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
          const { weeks: _, ...cycle } = c;
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

    await this.repository.deleteDoc(group.id);
  }

  findCycle(cycleId: string, group: Group) {
    return group.cycles.find((cycle) => cycle.id === cycleId);
  }

  findCycleOrFail(cycleId: string, group: Group) {
    const cycle = this.findCycle(cycleId, group);
    if (!cycle) throw new NotFoundException('Cycle does not exist');
    return cycle;
  }

  private async validateBatch(
    input: BatchUpdateOneGroupDto[],
  ): Promise<Group[]> {
    if (!input.length)
      throw new BadRequestException('Do not provide an empty array of groups');

    const groups = await this.firebaseService.batchIn<Group>(
      'id',
      input.map((g) => g.id),
      this.repository.collection(),
    );

    if (groups.length !== input.length)
      throw new BadRequestException('Invalid groups provided');

    const uniqueInstitutionIds = [
      ...new Set(groups.map((g) => g.institutionId)),
    ];

    if (uniqueInstitutionIds.length !== 1)
      throw new BadRequestException(
        'You can only update groups from the same institution',
      );

    const institution = await this.institutionService.getDocByIdOrFail(
      groups[0],
    );

    for (const group of groups) group.institution = institution;
    return groups;
  }

  private validateMembersInInstitution(
    members: User[],
    institution: Institution,
  ) {
    for (const member of members)
      if (!institution.athleteIds.includes(member.uid))
        throw new BadRequestException(
          `User ${member.displayName || member.email} is not part of the institution and cannot be added`,
        );
  }

  private isCycleOverlap(cycles: Cycle[]): boolean {
    if (!cycles || cycles.length < 2) return false;

    // console.log('checking overlap:', cycles);

    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );

    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const current = sortedCycles[i];
      const next = sortedCycles[i + 1];
      if (new Date(current.to) > new Date(next.from)) return true;
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
      this.firebaseService.isManager(user) &&
      institution.ownerId === user.uid
    )
      // manager can edit all groups
      return true;

    return false;
  }
}
