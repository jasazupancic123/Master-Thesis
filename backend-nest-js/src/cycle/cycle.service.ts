import { BadRequestException, forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Cycle } from '../group/entity/cycle.entity';
import { User } from '../common/type/custom-claims.type';
import { GroupService } from '../group/group.service';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { CommonService } from '../common/service/common.service';
import { Filter } from '../common/type/orm.type';
import { Wrapper } from '../common/type/wrapper.type';
import { Timestamp } from 'firebase-admin/firestore';
import { WhereFilterOp } from 'firebase-admin/lib/firestore';

@Injectable()
export class CycleService {
  private logger: Logger = new Logger(CycleService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(Cycle) private readonly repository: FirestoreRepository<Cycle>,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
  ) {
  }

  isOwner(user: User, cycle: Cycle) {
    return this.groupService.isOwner(user, cycle.group);
  }

  async create(user: User, data: Partial<Cycle>): Promise<Cycle> {
    const { groupId, name, description, startDate, endDate } = data;
    const group = await this.groupService.findOneByIdOrFail(user, groupId);

    this.logger.debug(`Creating cycle (user ${user.uid}) for group ${groupId}: ${JSON.stringify(data)}`);
    const cycle = await this.repository.create({
      groupId,
      name,
      description,
      startDate,
      endDate,
    });

    return this.populate(cycle, { group });
  }

  /**
   * Cycles must not have overlapping dates. This function returns the cycle
   * that falls within the given date range.
   */
  async findActive(user: User, groupId: string, date: Date): Promise<Cycle | null> {
    // find first cycle that overlaps with the given date
    const cycles = await this.findAll(user, { groupId });
    return cycles.find(cycle => this.commonService.date.isBetween(date, cycle.startDate, cycle.endDate));
  }

  async findAll(user: User, filter?: Filter<Cycle>): Promise<Cycle[]> {
    if (!filter?.groupId)
      throw new BadRequestException('You must provide group id to filter cycles');

    const group = await this.groupService.findOneByIdOrFail(user, filter.groupId);

    const { startDate, endDate } = filter;
    const conditions: { field: keyof Cycle, operator: WhereFilterOp, value: any }[] = [
      { field: 'groupId', operator: '==', value: filter.groupId as any },
    ];

    if (startDate) conditions.push({ field: 'startDate', operator: '>=', value: Timestamp.fromDate(startDate) });
    if (endDate) conditions.push({ field: 'endDate', operator: '<=', value: Timestamp.fromDate(endDate) });

    const cycles = await this.repository.findAllByMany(conditions);
    return cycles.map(cycle => this.populate(cycle, { group }));
  }

  /**
   * Find one cycle by id or throw an error. It also makes sure that the user
   * belongs to the group or is the group owner.
   */
  async findOneByIdOrFail(user: User, id: string) {
    const cycle = await this.repository.findOneByIdOrFail(id);
    const group = await this.groupService.findOneByIdOrFail(user, cycle.groupId);
    return this.populate(cycle, { group });
  }

  /**
   * Updates a cycle. It only allows the group owner to update the cycle.
   */
  async update(user: User, id: string, data: Partial<Cycle>) {
    const { name, startDate, endDate } = data;

    // check if cycle exists and that user is the group owner
    const cycle = await this.findOneByIdOrFail(user, id);
    if (!this.groupService.isOwner(user, cycle.group))
      throw new UnauthorizedException('You are not the group owner');

    const updated = await this.repository.update(id, {
      name,
      startDate,
      endDate,
    });

    const { group, trainings } = cycle;
    return this.populate(updated, { group, trainings });
  }

  private populate(item: Cycle, relations: Partial<Cycle>): Cycle {
    item.group = relations.group;
    item.trainings = relations.trainings || [];
    item.weeks = this.commonService.date.weeks(item.startDate, item.endDate);
    return item;
  }
}