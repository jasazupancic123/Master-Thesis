import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { AuthService } from '@src/auth/service/auth.service';
import { UpdateMembersDto } from '@src/common/dto/user-id.dto';
import {
  BatchDeleteOperation,
  BatchOperation,
  BatchWriteOperation,
} from '@src/common/type/orm.type';
import { INSTITUTION_ATHLETE_EVENT } from '@src/institution/constant/update-institution-athlete-event.constant';
import { UpdateInstitutionAthleteEvent } from '@src/institution/event/update-institution-athlete.event';

import { LogMethod } from '../common/decorator/log-method.decorator';
import { Permission } from '../common/interface/permission.interface';
import { CommonService } from '../common/service/common.service';
import { Create, Update } from '../common/type/entity.type';
import { User } from '../common/type/firebase-auth.type';
import { GroupRef } from '../common/type/firestore.type';
import { FirebaseService } from '../firebase/firebase.service';
import { Institution } from '../institution/entity/institution.entity';
import { InstitutionService } from '../institution/service/institution.service';
import { DELETE_GROUP_EVENT } from './constant/delete-group-event.constant';
import { CreateGroupDto } from './dto/create-group.dto';
import { BatchUpdateOneGroupDto, UpdateGroupDto } from './dto/update-group.dto';
import { Cycle } from './entity/cycle.entity';
import { Group } from './entity/group.entity';
import { DeleteGroupOrCycleEvent } from './event/delete-group.event';
import { GroupRepository } from './repository/group.repository';

@Injectable()
export class GroupService implements Permission<Group, Institution> {
  constructor(
    private readonly repository: GroupRepository,
    private readonly commonService: CommonService,
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    private readonly institutionService: InstitutionService,
  ) {}

  findAllByInstitution(institutionId: string): Promise<Group[]> {
    return this.repository.findAll((q) =>
      q.where('institutionId', '==', institutionId),
    );
  }

  async findAll(user: User): Promise<Group[]> {
    if (this.firebase.isAdmin(user))
      return await this.repository.findAllByAdmin();

    if (this.firebase.isAthlete(user))
      return await this.repository.findAllByAthlete(user.uid);

    const institutions = await this.institutionService.findAll(user);
    const institutionIds = institutions.map((i) => i.id);
    return institutionIds.length > 0
      ? await this.repository.findAllByInstitutions(institutionIds)
      : [];
  }

  async findOneById(user: User, ref: GroupRef): Promise<Group | null> {
    // find group
    const group = await this.repository.findById(ref.groupId);
    if (!group || group.deletedAt) return null;

    // authorize
    group.institution = await this.institutionService.findByIdOrFail(group);
    if (!this.canView(user, group, group.institution))
      throw new UnauthorizedException('You are not allowed to view this group');

    return group;
  }

  async findOneByIdOrFail(user: User, ref: GroupRef): Promise<Group> {
    const group = await this.findOneById(user, ref);
    if (!group) throw new NotFoundException('Group does not exist');
    return group;
  }

  @LogMethod()
  async create(user: User, input: CreateGroupDto): Promise<Group> {
    const { name, membersIds, institutionId, ownerId } = input;

    // validate
    const institution = await this.institutionService.findByIdOrFail(input);
    await this.authService.findAllOrFail(user, { ids: membersIds });

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

    const groupId = await this.repository.save(data);
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
    if (!this.canEdit(user, group, group.institution))
      throw new UnauthorizedException('You are not allowed to edit this group');

    // validate cycles
    if (!input.cycles?.every((c) => group.cycles.some((ec) => ec.id === c.id)))
      throw new BadRequestException(
        `Cycles in group ${group.name} do not match. If you are trying to add or remove cycles, use separate route`,
      );

    if (this.isCycleOverlap(input.cycles))
      throw new BadRequestException('Cycles overlap');

    // validate owner
    if (input.ownerId)
      if (
        !this.firebase.isManager(user) ||
        group.institution.ownerId !== user.uid
      )
        throw new UnauthorizedException('You are not allowed to update owner');

    // update group
    const data: Update<Group> = {
      name: input.name,
      ownerId: input.ownerId,
      cycles: input.cycles,
    };

    await this.repository.update(ref.groupId, data);
    return {
      ...group,
      ...this.commonService.object.clean(data),
      updatedAt: new Date(),
    };
  }

  @LogMethod()
  async batchUpdate(user: User, input: BatchUpdateOneGroupDto[]) {
    // validate
    const groups = await this.validateBatch(input);

    // NOTE - trainer and manager can always edit all groups in the institution,
    // so this check is unnecessary, but still here
    for (const group of groups)
      if (!this.canEdit(user, group, group.institution!))
        throw new UnauthorizedException(
          `You are not allowed to edit group ${group.name}`,
        );

    // validate cycles
    const operations: BatchWriteOperation<Group>[] = [];
    for (const { id, name, cycles: inputCycles } of input) {
      if (!inputCycles) continue; // no cycles to update

      const existingGroup = groups.find((g) => g.id === id)!;
      const existingCycles = existingGroup.cycles;

      // all input cycles must be the same as existing cycles, since separate route handles adding/removing cycles
      if (
        !inputCycles.every((c) => existingCycles.some((ec) => ec.id === c.id))
      )
        throw new BadRequestException(
          `Cycles in group ${existingGroup.name} do not match. If you are trying to add or remove cycles, use separate route`,
        );

      if (this.isCycleOverlap(inputCycles))
        throw new BadRequestException(
          `Cycles in group ${existingGroup.name} cannot overlap`,
        );

      operations.push({
        ref: this.repository.doc(id),
        operation: 'update',
        data: this.firebase.buildUpdateQuery<Group>({
          ...existingGroup,
          name,
          cycles: inputCycles,
        }),
      });
    }

    await this.firebase.paginateBatches(operations);
  }

  @LogMethod()
  async addCycle(user: User, ref: GroupRef, cycle: Cycle) {
    // validate
    const group = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, group, group.institution))
      throw new UnauthorizedException('You are not allowed to edit this group');

    if (this.findCycle(cycle.id, group))
      throw new BadRequestException('Cycle already exists in the group');

    // validate cycle
    if (this.isCycleOverlap([...group.cycles, cycle]))
      throw new BadRequestException(
        'Cycle overlaps with existing cycles in the group',
      );

    // add cycle
    await this.repository.addCycle(group, cycle);
  }

  @LogMethod()
  async removeCycle(user: User, ref: GroupRef, cycleId: string): Promise<void> {
    // validate
    const group = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, group, group.institution))
      throw new UnauthorizedException('You are not allowed to remove cycle');

    // remove cycle from group & remove all trainings
    const cycle = this.findCycleOrFail(cycleId, group);
    const operations: BatchOperation<Group>[] = [
      {
        ref: this.repository.doc(ref.groupId),
        operation: 'update',
        data: this.firebase.buildUpdateQuery<Group>({
          cycles: group.cycles.filter((c) => c.id !== cycle.id),
        }),
      },
    ];

    await this.eventEmitter.emitAsync(
      DELETE_GROUP_EVENT,
      new DeleteGroupOrCycleEvent({
        operations,
        groupId: ref.groupId,
        cycleId,
      }),
    );

    await this.firebase.paginateBatches(operations);
  }

  @LogMethod()
  async updateMembers(user: User, ref: GroupRef, input: UpdateMembersDto) {
    const { userId: memberId, add } = input;

    // validate
    const group = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, group, group.institution))
      throw new UnauthorizedException('You are not allowed to update members');

    // check if member exists
    const member = await this.authService.findOneBy('id', memberId);
    if (!member) throw new BadRequestException('Member does not exist');
    if (!this.firebase.isAthlete(member))
      throw new BadRequestException('Member must be an athlete');

    // check if member is already in group
    if (group.membersIds.includes(member.uid) && add)
      throw new BadRequestException(`Member is already in the group`);

    // check if member is in institution
    if (!group.institution.athleteIds.includes(member.uid))
      throw new BadRequestException(`Member is not part of the institution`);

    // update group members
    const operations: BatchWriteOperation<{ membersIds: string[] }>[] = [
      // update member in group
      this.repository.getUpdateMemberOperation(group.id, member.uid, add),
    ];

    // update member in trainings
    await this.eventEmitter.emitAsync(
      INSTITUTION_ATHLETE_EVENT,
      new UpdateInstitutionAthleteEvent({
        operations,
        institutionId: group.institutionId,
        userId: member.uid,
        groupId: group.id,
        add,
      }),
    );

    await this.firebase.paginateBatches(operations);
  }

  @OnEvent(INSTITUTION_ATHLETE_EVENT, { async: true, promisify: true })
  @LogMethod()
  async handleUpdateInstitutionAthleteEvent(
    event: UpdateInstitutionAthleteEvent,
  ) {
    // add or remove user from all groups in the institution
    const { operations, institutionId, userId, add, groupId } = event;

    if (groupId)
      // only handle single group update
      operations.push(
        this.repository.getUpdateMemberOperation(groupId, userId, add),
      );
    else {
      // handle all groups in the institution
      const groups = await this.repository.findAllByInstitution(institutionId);
      for (const group of groups)
        operations.push(
          this.repository.getUpdateMemberOperation(group.id, userId, add),
        );
    }
  }

  @LogMethod()
  async delete(user: User, ref: GroupRef): Promise<void> {
    const group = await this.findOneByIdOrFail(user, ref);
    const institution = await this.institutionService.findByIdOrFail(group);

    if (!this.canDelete(user, group, institution))
      throw new UnauthorizedException(
        'You are not allowed to delete this group',
      );

    const operations: BatchDeleteOperation[] = [
      { ref: this.repository.doc(group.id), operation: 'delete' }, // delete group
    ];

    // delete all group trainings
    await this.eventEmitter.emitAsync(
      DELETE_GROUP_EVENT,
      new DeleteGroupOrCycleEvent({ operations, groupId: group.id }),
    );

    await this.firebase.paginateBatches(operations);
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

    const groups = await this.firebase.batchIn<Group>(
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

    const institution = await this.institutionService.findByIdOrFail(groups[0]);

    for (const group of groups) group.institution = institution;
    return groups;
  }

  private isCycleOverlap(cycles: Cycle[]): boolean {
    if (!cycles || cycles.length < 2) return false;

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
    if (
      this.firebase.isTrainer(user) &&
      institution.trainerIds.includes(user.uid)
    )
      return true; // owner of the group (trainer) can edit group

    if (this.firebase.isManager(user) && institution.ownerId === user.uid)
      // manager can edit all groups
      return true;

    return false;
  }

  canDelete(user: User, entity: Group, root?: Institution) {
    // only if user is manager and institution owner
    if (this.firebase.isManager(user) && root?.ownerId === user.uid)
      return true;
  }
}
