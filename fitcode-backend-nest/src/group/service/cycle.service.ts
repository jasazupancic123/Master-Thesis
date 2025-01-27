import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
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
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class CycleService {
  private readonly logger = new Logger(CycleService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly cycleRepository: CycleRepository,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
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
    if (options?.user)
      await this.groupService.findOneOrFail(ref, { user: options.user });

    return await this.cycleRepository.getDocs(ref, (collection) => {
      let query =
        options?.user && this.firebaseService.isTrainer(options!.user)
          ? collection.where('ownerId', '==', options!.user.uid)
          : options?.user && this.firebaseService.isAthlete(options!.user)
            ? collection.where(
                'membersIds',
                'array-contains',
                options!.user.uid,
              )
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
    options: FindOneOptions<Cycle> & { user: User },
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
        options?.populate,
      );

    return cycle;
  }

  async create(
    ref: Required<GroupRef>,
    input: CreateCycle,
    options: { user: User },
  ): Promise<Cycle> {
    // find parent references
    const group = await this.groupService.findOneOrFail(ref, {
      populate: ['members'],
    });

    this.logger.debug(
      `Creating cycle (user ${options.user.uid}) with data: ${JSON.stringify(input)}`,
    );

    // validate data
    const cycles = await this.findAll(
      { groupId: group.id },
      {
        user: options.user,
        filter: {
          from: { op: '<=', value: input.to },
          to: { op: '>=', value: input.from },
        },
      },
    );

    if (cycles.length > 0) throw new BadRequestException('Cycle overlap');

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
    options: { user: User },
  ): Promise<Cycle> {
    // find parent references
    const cycle = await this.findOneOrFail(ref, options);
    const group = cycle.group;

    this.logger.debug(
      `Updating cycle (user ${options.user.uid}) with data: ${JSON.stringify(input)}`,
    );

    // check that no other cycle overlaps with the new cycle
    if (input.from || input.to) {
      const cycles = await this.findAll(
        { groupId: group.id },
        {
          user: options.user,
          filter: {
            from: { op: '<=', value: input.to || cycle.to },
            to: { op: '>=', value: input.from || cycle.from },
          },
        },
      );

      const cyclesWithoutCurrent = cycles.filter((c) => c.id !== ref.cycleId);
      if (cyclesWithoutCurrent.length > 0)
        throw new BadRequestException('Cycle overlap');
    }

    // update cycle
    await this.cycleRepository.updateDoc(ref, input);

    return await this.findOne(ref, { ...options, populate: ['weeks'] });
  }

  async remove(
    ref: Required<CycleRef>,
    options: { user: User },
  ): Promise<void> {
    const { user } = options;
    this.logger.debug(`Deleting cycle (user ${user.uid})`);
    await this.findOneOrFail(ref, { user });
    await this.cycleRepository.deleteDoc(ref);
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
