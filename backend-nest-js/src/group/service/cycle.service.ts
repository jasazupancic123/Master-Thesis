import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CommonService } from '../../common/service/common.service';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { Filter, FindManyOptions, FindOneOptions, PaginateOptions, Populate } from '../../common/type/orm.type';
import { Cycle } from '../entity/cycle.entity';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { CycleRepository } from '../repository/cycle.repository';
import { Wrapper } from '../../common/type/wrapper.type';
import { TrainingService } from '../../training/service/training.service';
import { CycleRef, GroupRef } from '../../common/type/firebase-firestore.type';
import { GroupService } from './group.service';
import { User } from '../../common/type/firebase-auth.type';
import { CanViewService } from '../../common/type/auth.type';

@Injectable()
export class CycleService extends CanViewService<GroupRef> {
  private logger = new Logger(CycleService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly cycleRepository: CycleRepository,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
  ) {
    super();
  }

  async canView(user: User, ref: Required<GroupRef>): Promise<boolean> {
    return await this.groupService.canView(user, ref);
  }

  async findCycles(ref: Required<GroupRef>, options?: FindManyOptions<Cycle>): Promise<Cycle[]> {
    return await this.cycleRepository.getDocs(ref, (collection) => {
      let query = collection;
      if (options.filter) query = this.filter(query, options.filter);
      if (options.paginate) query = this.paginate(query, options.paginate);

      return query;
    });
  }

  async findUserCycles(user: User, ref: Required<GroupRef>, options?: FindManyOptions<Cycle>): Promise<Cycle[]> {
    await this.authorize(user, ref);
    return await this.findCycles(ref, options);
  }

  async findCycle(ref: Required<CycleRef>, options?: FindOneOptions<Cycle>): Promise<Cycle> {
    const cycle = await this.cycleRepository.getDoc(ref);
    if (!cycle) return null;

    if (options.populate) await this.populate(ref, cycle, options.populate);
    return cycle;
  }

  async findCycleOrFail(ref: Required<CycleRef>, options?: FindOneOptions<Cycle>): Promise<Cycle> {
    const cycle = await this.findCycle(ref, options);
    if (!cycle) throw new BadRequestException('Cycle not found');
    return cycle;
  }

  async findUserCycle(user: User, ref: Required<CycleRef>, options?: FindOneOptions<Cycle>): Promise<Cycle> {
    await this.authorize(user, ref);
    return await this.findCycle(ref, options);
  }

  async findUserCycleOrFail(user: User, ref: Required<CycleRef>, options?: FindOneOptions<Cycle>): Promise<Cycle> {
    await this.authorize(user, ref);
    return await this.findCycleOrFail(ref, options);
  }

  /**
   * There is no overlap between cycles, so only one cycle can be active at a
   * time. This function returns the active cycle for the given date. By
   * default, it uses the current date.
   */
  async findActiveCycle(
    ref: Required<GroupRef>,
    date = new Date(),
    _options?: FindOneOptions<Cycle>,
  ): Promise<Cycle | null> {
    const cycles = await this.findCycles(ref, { filter: { to: { value: date } } });
    return cycles[0] || null;
  }

  async create(ref: Required<GroupRef>, input: Partial<Cycle>): Promise<Cycle> {
    await this.groupService.findGroupOrFail(ref.groupId);

    // validate data
    if (input.from >= input.to)
      throw new BadRequestException('Cycle start date must be before end date');

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
      weeks: [],
      trainings: [],
    };
  }

  private filter(query: Query, filter: Filter<Cycle>): Query {
    if (filter.ids) query = query.where('id', 'in', filter.ids);
    if (filter.name) query = query.where('name', '>=', filter.name.value).where('name', '<=', filter.name.value + '\uf8ff');
    if (filter.from) query = query.where('from', filter.from.op || '<=', Timestamp.fromDate(filter.from.value));
    if (filter.to) query = query.where('to', filter.to.op || '>=', Timestamp.fromDate(filter.to.value));

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

  private async populate(ref: Required<CycleRef>, cycle: Cycle, populate: Populate<Cycle>[]): Promise<Cycle> {
    if (populate.includes('weeks'))
      cycle.weeks = this.commonService.date.weeks(cycle.from, cycle.to);

    if (populate.includes('trainings')) {
      const options = { populate: [] };
      if (populate.includes('trainings.components'))
        options.populate.push('components');

      cycle.trainings = await this.trainingService.findTrainings(ref, options);
    }

    return cycle;
  }
}