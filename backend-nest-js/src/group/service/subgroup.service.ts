import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UserService } from '../../user/service/user.service';
import { SubgroupRepository } from '../repository/subgroup.repository';
import {
  GroupRef,
  SubgroupRef,
} from '../../common/type/firebase-firestore.type';
import { GroupService } from './group.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { Subgroup } from '../entity/subgroup.entity';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';

@Injectable()
export class SubgroupService {
  constructor(
    private readonly userService: UserService,
    private readonly subgroupRepository: SubgroupRepository,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
  ) {}

  async findAll(
    ref: Required<GroupRef>,
    options?: FindManyOptions<Subgroup>,
  ): Promise<Subgroup[]> {
    // find parent references
    await this.groupService.findOneOrFail(ref);

    const items = await this.subgroupRepository.getDocs(ref, (collection) => {
      let query = collection;
      if (options?.filter) query = this.filter(query, options.filter);
      if (options?.paginate) query = this.paginate(query, options.paginate);

      return query;
    });

    if (options?.populate)
      await Promise.all(
        items.map((subgroup) => {
          const subgroupRef = { ...ref, subgroupId: subgroup.id };
          this.populate(subgroupRef, subgroup, options.populate);
        }),
      );

    return items;
  }

  /**
   * All subgroups have `from` and `to` dates which define the active period of
   * the subgroup. To get all active subgroups, we need to filter the subgroups
   * where today's date is between `from` and `to` dates.
   */
  async findAllActive(
    ref: Required<GroupRef>,
    options?: FindManyOptions<Subgroup>,
  ): Promise<Subgroup[]> {
    return await this.findAll(ref, {
      ...options,
      filter: {
        ...(options?.filter || {}),
        from: { op: '<=', value: new Date() },
        to: { op: '>=', value: new Date() },
      },
    });
  }

  async findOne(
    ref: Required<SubgroupRef>,
    options?: FindOneOptions<Subgroup> & { authorize?: boolean },
  ): Promise<Subgroup> {
    // find parent references
    await this.groupService.findOneOrFail(ref, {
      authorize: options?.authorize,
    });

    // find subgroup
    const subgroup = await this.subgroupRepository.getDoc(ref);
    if (!subgroup) return null;

    if (options?.populate) await this.populate(ref, subgroup, options.populate);
    return subgroup;
  }

  async findOneOrFail(
    ref: Required<SubgroupRef>,
    options?: FindOneOptions<Subgroup> & { authorize?: boolean },
  ): Promise<Subgroup> {
    const subgroup = await this.findOne(ref, options);
    if (!subgroup) throw new BadRequestException('Subgroup not found');
    return subgroup;
  }

  async create(
    ref: Required<GroupRef>,
    input: Partial<Subgroup>,
  ): Promise<Subgroup> {
    // find parent references
    await this.groupService.findOneOrFail(ref);

    // validate data
    const membersIds = await this.groupService.findAvailableMembers(ref);
    if (!input.membersIds.every((memberId) => membersIds.includes(memberId)))
      throw new BadRequestException(
        'Some members are occupied in other subgroups',
      );

    // create subgroup
    const data = {
      name: input.name,
      cycleId: input.cycleId,
      membersIds: input.membersIds,
      from: input.from,
      to: input.to,
    };

    const subgroupId = await this.subgroupRepository.addDoc(ref, data);
    return {
      id: subgroupId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
    };
  }

  private filter(query: Query, filter: Filter<Subgroup>): Query {
    if (filter.ids) query = query.where('id', 'in', filter.ids);

    if (filter.membersIds)
      query = query.where(
        'membersIds',
        'array-contains-any',
        filter.membersIds,
      );

    if (filter.name)
      query = query
        .where('name', '>=', filter.name.value)
        .where('name', '<=', filter.name.value + '\uf8ff');

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

  private paginate(query: Query, paginate: PaginateOptions<Subgroup>): Query {
    const orderBy = paginate.orderBy || { field: 'from', value: 'desc' };
    const page = paginate.page || 1;
    const pageSize = paginate.pageSize || DEFAULT_PAGE_SIZE;

    return query
      .orderBy(orderBy.field, orderBy.value)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }

  private async populate(
    ref: Required<SubgroupRef>,
    subgroup: Subgroup,
    populate: Populate<Subgroup>[],
  ): Promise<Subgroup> {
    if (populate.includes('members'))
      subgroup.members = await this.userService.findAll({
        ids: subgroup.membersIds,
      });

    return subgroup;
  }
}
