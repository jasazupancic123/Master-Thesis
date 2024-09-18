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
import { TrainingService } from '../../training/service/training.service';
import { CycleRef, GroupRef } from '../../common/type/firebase-firestore.type';
import { GroupService } from './group.service';
import { CreateCycle } from '../type/cycle.type';
import { Validate } from '../../common/type/validate.type';
import { SubgroupService } from './subgroup.service';
import { Group } from '../entity/group.entity';
import { isAfter, isBefore } from 'date-fns';

@Injectable()
export class CycleService {
  constructor(
    private readonly commonService: CommonService,
    private readonly cycleRepository: CycleRepository,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    private readonly subgroupService: SubgroupService,
  ) {}

  async findAll(
    ref: Required<GroupRef>,
    options?: FindManyOptions<Cycle> & { authorize?: boolean },
  ): Promise<Cycle[]> {
    await this.groupService.findOneOrFail(ref, {
      authorize: options?.authorize,
    });

    return await this.cycleRepository.getDocs(ref, (collection) => {
      let query = collection;
      if (options?.filter) query = this.filter(query, options.filter);
      if (options?.paginate) query = this.paginate(query, options.paginate);

      return query;
    });
  }

  async findAllByMember(
    userId: string,
    options?: FindManyOptions<Cycle>,
  ): Promise<Cycle[]> {
    // find all active groups for the user (groups that are ongoing)
    const groups = await this.groupService.findAllByMember(userId, {
      populate: ['cycles'],
    });

    // custom filter for cycles
    if (options?.filter) {
      const { from, to } = options.filter;
      for (const group of groups)
        group.cycles = group.cycles.filter((cycle) => {
          if (from && to) {
            if (from.op === '<' || from.op === '<=')
              return (
                isBefore(from.value, cycle.from) && isBefore(to.value, cycle.to)
              );
            if (from.op === '>' || from.op === '>=')
              return (
                isAfter(from.value, cycle.from) && isAfter(to.value, cycle.to)
              );
          }

          if (from) {
            if (from.op === '<' || from.op === '<=')
              return isBefore(from.value, cycle.from);
            if (from.op === '>' || from.op === '>=')
              return isAfter(from.value, cycle.from);
          }

          if (to) {
            if (to.op === '<' || to.op === '<=')
              return isBefore(to.value, cycle.to);
            if (to.op === '>' || to.op === '>=')
              return isAfter(to.value, cycle.to);
          }

          return true;
        });
    }

    return groups.flatMap((group) =>
      group.cycles.map((cycle) => ({
        ...cycle,
        group,
      })),
    );
  }

  async findOne(
    ref: Required<CycleRef>,
    options?: FindOneOptions<Cycle> & { authorize?: boolean },
  ): Promise<Cycle> {
    // find parent references
    const group = await this.groupService.findOneOrFail(ref, {
      authorize: options?.authorize,
    });

    const cycle = await this.cycleRepository.getDoc(ref);
    if (!cycle) return null;

    if (options?.populate) await this.populate(ref, cycle, options.populate);
    cycle.group = group;
    return cycle;
  }

  async findOneOrFail(
    ref: Required<CycleRef>,
    options?: FindOneOptions<Cycle> & { authorize?: boolean },
  ): Promise<Cycle> {
    const cycle = await this.findOne(ref, options);
    if (!cycle) throw new BadRequestException('Cycle not found');
    return cycle;
  }

  /**
   * There is no overlap between cycles, so only one cycle can be active at a
   * time. This function returns the active cycle for the given date. By
   * default, it uses the current date.
   */
  async findActiveCycle(
    userId: string,
    date = new Date(),
    options?: FindOneOptions<Cycle>,
  ): Promise<Cycle | null> {
    // find all active groups for the user (groups that are ongoing)
    const groups = await this.groupService.findAllByMember(userId, {
      active: true,
      populate: ['cycles'],
    });

    // find first active cycle for the given date
    for (const group of groups)
      for (const cycle of group.cycles)
        if (this.commonService.date.isBetween(date, cycle.from, cycle.to)) {
          const ref = {
            uid: group.ownerId,
            groupId: group.id,
            cycleId: cycle.id,
          };

          const activeCycle = await this.findOne(ref, {
            ...options,
            authorize: false,
          });

          activeCycle.group = group;
          return activeCycle;
        }

    return null;
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
    const data = {
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
      trainings: [],
      subgroups: [],
      group,
    };
  }

  private async validate(
    group: Group,
    input: Partial<Cycle>,
  ): Promise<Validate> {
    // check that this cycle does not overlap with existing cycles in the group
    const ref = { uid: group.ownerId, groupId: group.id };
    const cycles = await this.findAll(ref, { authorize: false });
    const overlap = cycles.find(
      (c) =>
        (input.from >= c.from && input.from <= c.to) ||
        (input.to >= c.from && input.to <= c.to),
    );

    if (overlap)
      return {
        error: true,
        message: 'Cycle overlaps with existing cycle in the group',
      };

    // check that all members in the group do not have any cycles in other
    // groups that they belong to that overlap with this cycle
    const invalidMembers = (
      await Promise.all(
        group.members.map(async (member) => {
          const memberCycles = await this.findAllByMember(member.uid, {
            filter: {
              to: { op: '<=', value: input.from },
            },
          });

          console.log('cycles for member', member.email, memberCycles.length);

          return memberCycles.length > 0 ? member : null;
        }),
      )
    ).filter((member) => member);

    if (invalidMembers.length > 0)
      return {
        error: true,
        message: `Members ${invalidMembers.map((m) => m.email).join(', ')} have overlapping cycles in other groups`,
      };

    return { error: false };
  }

  private filter(query: Query, filter: Filter<Cycle>): Query {
    if (filter.ids)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

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
    ref: Required<CycleRef>,
    cycle: Cycle,
    populate: Populate<Cycle>[],
  ): Promise<Cycle> {
    if (populate.includes('weeks'))
      cycle.weeks = this.commonService.date.weeks(cycle.from, cycle.to);

    if (populate.includes('trainings')) {
      const options = { populate: [] };
      if (populate.includes('trainings.components'))
        options.populate.push('components');

      cycle.trainings = await this.trainingService.findAll(ref, {
        ...options,
        authorize: false,
      });
    }

    if (populate.includes('subgroups'))
      cycle.subgroups = await this.subgroupService.findAll(ref, {
        filter: { cycleId: { value: cycle.id } },
      });

    return cycle;
  }
}
