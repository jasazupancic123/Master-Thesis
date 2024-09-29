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
import { CreateSubgroup, UpdateSubgroup } from '../type/subgroup.type';
import { User } from '../../common/type/firebase-auth.type';
import { TrainingService } from '../../training/service/training.service';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class SubgroupService {
  constructor(
    private readonly userService: UserService,
    private readonly subgroupRepository: SubgroupRepository,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
  ) {}

  async findAll(
    ref: Required<GroupRef>,
    options?: FindManyOptions<Subgroup> & { user?: User },
  ): Promise<Subgroup[]> {
    // find parent references
    await this.groupService.findOneOrFail(ref, { user: options?.user });

    const items = await this.subgroupRepository.getDocs(ref, (collection) => {
      let query = collection.where('deletedAt', '==', null);
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
    options?: FindManyOptions<Subgroup> & { user?: User },
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
    options?: FindOneOptions<Subgroup> & { user?: User },
  ): Promise<Subgroup> {
    // find parent references
    const group = await this.groupService.findOneOrFail(ref, {
      user: options?.user,
    });

    // find subgroup
    const subgroup = await this.subgroupRepository.getDoc(ref);
    if (!subgroup || subgroup.deletedAt) return null;

    if (options?.populate) await this.populate(ref, subgroup, options.populate);

    subgroup.group = group;
    return subgroup;
  }

  async findOneOrFail(
    ref: Required<SubgroupRef>,
    options?: FindOneOptions<Subgroup> & { user?: User },
  ): Promise<Subgroup> {
    const subgroup = await this.findOne(ref, options);
    if (!subgroup) throw new BadRequestException('Subgroup not found');
    return subgroup;
  }

  async create(
    ref: Required<GroupRef>,
    input: CreateSubgroup,
    options: { user: User },
  ): Promise<Subgroup> {
    // find parent references
    const { user } = options;
    const group = await this.groupService.findOneOrFail(ref, { user });

    // check if the subgroup overlaps with the existing subgroups
    const subgroups = await this.findAllActive(ref, { user });
    if (subgroups.length > 0)
      throw new BadRequestException(
        'Subgroups cannot overlap with the existing subgroups',
      );

    // check if the members are available
    const membersIds = await this.groupService.findAvailableMembers(ref, {
      user,
    });

    if (!membersIds.length)
      throw new BadRequestException('No members available for subgroup');

    if (!input.membersIds.every((memberId) => membersIds.includes(memberId)))
      throw new BadRequestException(
        'Some members are occupied in other subgroups',
      );

    // create subgroup
    const subgroupId = await this.subgroupRepository.addDoc(ref, {
      groupId: group.id,
      name: input.name,
      membersIds: input.membersIds,
      from: input.from,
      to: input.to,
    });

    // copy all trainings from the parent group between `from` and `to` dates
    const trainings = await this.trainingService.findAll(user, {
      filter: {
        subgroupId: { value: null },
        from: { op: '>=', value: startOfDay(input.from) },
        to: { op: '<=', value: endOfDay(input.to) },
      },
    });

    for (const { id: trainingId } of trainings) {
      await this.trainingService.copy(
        user,
        { trainingId },
        {
          groupId: ref.groupId,
          subgroupId,
        },
      );
    }

    // remove members from trainings in parent group
    for (const training of trainings) {
      const trainingRef = { trainingId: training.id };
      await this.trainingService.update(user, trainingRef, {
        membersIds: training.membersIds.filter(
          (memberId) => !input.membersIds.includes(memberId),
        ),
      });
    }

    return {
      id: subgroupId,
      groupId: ref.groupId,
      membersIds: input.membersIds,
      name: input.name,
      from: input.from,
      to: input.to,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
    };
  }

  async update(
    ref: Required<SubgroupRef>,
    input: UpdateSubgroup,
    options: { user: User },
  ) {
    await this.findOneOrFail(ref, options);
    await this.subgroupRepository.updateDoc(ref, input);
  }

  async remove(ref: Required<SubgroupRef>, options: { user: User }) {
    const { user } = options;
    await this.findOneOrFail(ref, { user });
    await this.subgroupRepository.deleteDoc(ref);
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
    _ref: Required<SubgroupRef>,
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
