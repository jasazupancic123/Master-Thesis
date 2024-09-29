import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CommonService } from '../../common/service/common.service';
import { FieldPath, Query, Timestamp } from 'firebase-admin/firestore';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { Cycle } from '../entity/cycle.entity';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { CycleRepository } from '../repository/cycle.repository';
import { Wrapper } from '../../common/type/wrapper.type';
import { CycleRef, GroupRef } from '../../common/type/firebase-firestore.type';
import { GroupService } from './group.service';
import { CreateCycle, UpdateCycle } from '../type/cycle.type';
import { Validate } from '../../common/type/validate.type';
import { Group } from '../entity/group.entity';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { SubgroupService } from './subgroup.service';

@Injectable()
export class CycleService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly cycleRepository: CycleRepository,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => SubgroupService))
    private readonly subgroupService: Wrapper<SubgroupService>,
  ) {}

  async findOne(
    ref: Required<CycleRef>,
    options?: FindOneOptions<Cycle> & { user?: User },
  ): Promise<Cycle> {
    // find parent references
    const group = await this.groupService.findOneOrFail(ref, {
      user: options?.user,
    });

    const cycle = await this.cycleRepository.getDoc(ref);
    if (!cycle || cycle.deletedAt) return null;

    if (options?.populate) await this.populate(ref, cycle, options.populate);
    cycle.group = group;
    return cycle;
  }

  async findOneOrFail(
    ref: Required<CycleRef>,
    options?: FindOneOptions<Cycle> & { user?: User },
  ): Promise<Cycle> {
    const cycle = await this.findOne(ref, options);
    if (!cycle) throw new BadRequestException('Cycle not found');
    return cycle;
  }

  async findAll(
    ref: Required<GroupRef>,
    options?: FindManyOptions<Cycle> & { user?: User },
  ): Promise<Cycle[]> {
    const user = options?.user;
    if (!user) throw new BadRequestException('User not found');

    await this.groupService.findOneOrFail(ref, { user });
    const isTrainer = this.firebaseService.isTrainer(user);
    const isAthlete = this.firebaseService.isAthlete(user);

    return await this.cycleRepository.getDocs(ref, (collection) => {
      let query = isTrainer
        ? collection.where('ownerId', '==', user.uid)
        : isAthlete
          ? collection.where('membersIds', 'array-contains', user.uid)
          : collection;

      query = query.where('deletedAt', '==', null);
      if (options?.filter) query = this.filter(query, options.filter);
      if (options?.paginate) query = this.paginate(query, options.paginate);

      return query;
    });
  }

  /**
   * There is no overlap between cycles, so only one cycle can be active at a
   * time. This function returns the active cycle for the given date. By
   * default, it uses the current date.
   */
  async findActiveCycleByGroup(
    ref: Required<GroupRef>,
    date = new Date(),
    options?: FindOneOptions<Cycle> & { user?: User },
  ): Promise<Cycle | null> {
    // find all active groups for the user (groups that are ongoing)
    const cycles = await this.findAll(ref, {
      user: options?.user,
      filter: {
        from: { op: '<=', value: date },
        to: { op: '>=', value: date },
      },
    });

    if (cycles.length === 0) return null;

    const cycle = cycles[0];
    if (options?.populate)
      await this.populate(
        { ...ref, cycleId: cycle.id },
        cycle,
        options.populate,
      );

    return cycle;
  }

  async create(ref: Required<GroupRef>, input: CreateCycle): Promise<Cycle> {
    // find parent references
    const group = await this.groupService.findOneOrFail(ref, {
      populate: ['members'],
    });

    // validate data
    const { error, message } = await this.validate(group, input);
    if (error) throw new BadRequestException(message);

    // create cycle
    const data: CreateCycle = {
      groupId: group.id,
      ownerId: group.ownerId,
      membersIds: group.membersIds,
      name: input.name,
      description: input.description,
      from: input.from,
      to: input.to,
    };

    const cycleId = await this.cycleRepository.addDoc(ref, data);
    return {
      id: cycleId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      weeks: this.commonService.date.weeks(input.from, input.to),
      group,
    };
  }

  async update(
    ref: Required<CycleRef>,
    input: UpdateCycle,
    options?: { user?: User },
  ): Promise<Cycle> {
    const user = options?.user;
    if (!user) throw new BadRequestException('User not found');

    // find parent references
    const cycle = await this.findOneOrFail(ref, { user });
    const group = cycle.group;

    // validate data
    const { error, message } = await this.validate(group, input);
    if (error) throw new BadRequestException(message);

    // update cycle
    await this.cycleRepository.updateDoc(ref, {
      name: input.name,
      description: input.description,
      from: input.from,
      to: input.to,
    });

    return {
      id: ref.cycleId,
      groupId: ref.groupId,
      ownerId: cycle.ownerId,
      membersIds: cycle.membersIds,
      name: input.name || cycle.name,
      description: input.description || cycle.description,
      from: input.from || cycle.from,
      to: input.to || cycle.to,
      createdAt: cycle.createdAt,
      updatedAt: new Date(),
      weeks: this.commonService.date.weeks(input.from, input.to),
      group,
    };
  }

  async remove(
    ref: Required<CycleRef>,
    options?: { user?: User },
  ): Promise<void> {
    const user = options?.user;
    if (!user) throw new BadRequestException('User not found');
    const cycle = await this.findOneOrFail(ref, { user });

    // remove all subgroups within the cycles
    const subgroups = await this.subgroupService.findAll(ref, {
      user,
      filter: {
        from: { op: '>=', value: cycle.from },
        to: { op: '<=', value: cycle.to },
      },
    });

    for (const { id: subgroupId } of subgroups)
      await this.subgroupService.remove({ ...ref, subgroupId }, { user });

    await this.cycleRepository.deleteDoc(ref);
  }

  private async validate(
    group: Group,
    input: Partial<Cycle>,
  ): Promise<Validate> {
    // check that this cycle does not overlap with existing cycles in the group
    const ref = { groupId: group.id };
    const activeCycle = await this.findActiveCycleByGroup(ref);
    if (activeCycle)
      return { error: true, message: 'Cycle cannot overlap with other cycles' };

    return { error: false };
  }

  private filter(query: Query, filter: Filter<Cycle>): Query {
    if (filter.ids)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.ownerId)
      query = query.where('ownerId', '==', filter.ownerId.value);

    if (filter.membersIds)
      query = query.where(
        'membersIds',
        'array-contains-any',
        filter.membersIds.value,
      );

    if (filter.groupId)
      query = query.where('groupId', '==', filter.groupId.value);

    if (filter.name)
      query = query
        .where('name', '>=', filter.name.value)
        .where('name', '<=', filter.name.value + '\uf8ff');

    if (filter.from)
      query = query.where(
        'from',
        filter.from.op || '<=',
        Timestamp.fromDate(filter.from.value),
      );

    if (filter.to)
      query = query.where(
        'to',
        filter.to.op || '>=',
        Timestamp.fromDate(filter.to.value),
      );

    return query;
  }

  private paginate(query: Query, paginate: PaginateOptions<Cycle>): Query {
    const orderBy = paginate.orderBy || { field: 'from', value: 'desc' };
    const page = paginate.page || 1;
    const pageSize = paginate.pageSize || DEFAULT_PAGE_SIZE;

    return query
      .orderBy(orderBy.field, orderBy.value)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }

  private async populate(
    _ref: Required<CycleRef>,
    cycle: Cycle,
    populate: Populate<Cycle>[],
  ): Promise<Cycle> {
    if (populate.includes('weeks'))
      cycle.weeks = this.commonService.date.weeks(cycle.from, cycle.to);

    return cycle;
  }
}
