import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../common/type/custom-claims.type';
import { CycleService } from '../cycle/cycle.service';
import { Timestamp } from 'firebase-admin/firestore';
import { Training } from './entity/training.entity';
import { ComponentService } from '../component/component.service';
import { ExerciseService } from '../exercise/exercise.service';
import { Wrapper } from '../common/type/wrapper.type';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { CommonService } from '../common/service/common.service';
import { SetService } from '../set/set.service';
import { Options } from '../common/type/orm.type';
import { Cycle } from '../group/entity/cycle.entity';
import { Validate } from '../common/type/validate.type';
import { CopyTrainingDto } from './dto/copy-training.dto';
import { Group } from '../group/entity/group.entity';
import { formatDate } from 'date-fns';
import { AthleteTrainingFilterDto } from './dto/training-filter.dto';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly commonService: CommonService,
    @InjectRepository(Training)
    private readonly repository: FirestoreRepository<Training>,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => CycleService)) private readonly cycleService: Wrapper<CycleService>,
    @Inject(forwardRef(() => SetService)) private readonly setService: Wrapper<SetService>,
  ) {
  }

  async canView(user: User, cycle: Cycle | string): Promise<boolean> {
    // ensure that user can access cycle
    await this.cycleService.findOneByIdOrFail(user, typeof cycle === 'string' ? cycle : cycle.id);
    return true;
  }

  async isOwner(user: User, cycle: Cycle): Promise<boolean> {
    return this.cycleService.isOwner(user, cycle);
  }

  async populate(training: Training): Promise<Training> {
    training.setGroups = await this.setService.findAllSetGroupsByTrainingId(training.id);
    return training;
  }

  async findCycle(user: User, trainingId: string): Promise<Cycle> {
    const training = await this.repository.findOneById(trainingId);
    return await this.cycleService.findOneByIdOrFail(user, training.cycleId);
  }

  async findOneById(user: User, id: string): Promise<Training | null> {
    const training = await this.repository.findOneById(id);
    if (!training)
      return null;

    await this.canView(user, training.cycleId);
    return await this.populate(training);
  }

  async findOneByIdOrFail(user: User, id: string): Promise<Training> {
    const training = await this.repository.findOneByIdOrFail(id);
    await this.canView(user, training.cycleId);
    return await this.populate(training);
  }

  async findGroup(user: User, training: Training): Promise<Group | null> {
    const cycle = await this.cycleService.findOneByIdOrFail(user, training.cycleId);
    return cycle.group;
  }

  async findAll(user: User, options?: Options<Training>): Promise<Training[]> {
    const filter = options?.filter || {};
    const { cycleId, subgroupId = null } = filter;

    if (!cycleId)
      throw new BadRequestException('Cycle id is required');

    const cycle = await this.cycleService.findOneByIdOrFail(user, cycleId); // ensure that user can access cycle
    let query = this.repository
      .getCollection()
      .where('cycleId', '==', cycle.id)
      .where('subgroupId', '==', subgroupId);

    if (filter.startTime)
      query = query.where('startTime', '>=', Timestamp.fromDate(filter.startTime));

    if (filter.endTime)
      query = query.where('endTime', '<=', Timestamp.fromDate(filter.endTime));

    const data = await query.orderBy('startTime').get();
    const trainings = data.docs.map(item => this.repository.serialize(item));

    return await Promise.all(trainings.map(training => this.populate(training)));
  }

  async findAllAthleteTrainings(user: User, filter: AthleteTrainingFilterDto): Promise<Training[]> {
    // get athlete's current active cycle
    const cycle = await this.cycleService.findActive(user, filter.groupId, filter.startTime);
    console.log('active cycle:', cycle);

    // find all subgroups that user is part of
    const subgroups = (cycle.group.subgroups || []).filter(subgroup => subgroup.membersIds.includes(user.uid));

    // for each subgroup, find all trainings
    const subgroupTrainings = await Promise.all(subgroups.map(async subgroup => {
      return await this.findAll(user, {
        filter: {
          cycleId: cycle.id,
          subgroupId: subgroup.id,
          startTime: filter.startTime,
          endTime: filter.endTime,
        },
      });
    }));

    // find all parent group trainings for the provided cycle
    const trainings = await this.findAll(user, {
      filter: {
        startTime: filter.startTime,
        endTime: filter.endTime,
      },
    });

    /* all subgroups have `createdAt` and `validUntil` fields which indicate
    the date range for which the subgroup is valid and each subgroup has unique
    dates so there is no overlap between subgroups. Now, we get the union of all
    subgroup dates and return their trainings, and for the dates that are not in
    the union, return the parent group trainings. */

    const subgroupsDateRange = subgroups
      .map(subgroup => ({ start: subgroup.createdAt, end: subgroup.validUntil }))
      .map(date => [date.start, date.end]);

    const groupDateRange = this.commonService.date.negateRange(subgroupsDateRange);

    console.log(subgroupsDateRange.map(date => date.map(d => formatDate(d, 'yyyy-MM-dd'))));
    console.log(groupDateRange.map(date => date.map(d => formatDate(d, 'yyyy-MM-dd'))));

    return [];
  }

  async validate(user: User, data: Partial<Training>): Promise<Validate<{ cycle: Cycle, subgroup: Group | null }>> {
    const cycle = await this.cycleService.findOneByIdOrFail(user, data.cycleId);

    // check that user is owner of cycle
    const isOwner = await this.isOwner(user, cycle);
    if (!isOwner)
      return { error: true, message: 'You are not authorized to create training for this cycle' };

    // check that subgroup exists within cycle's parent group
    const subgroup = (cycle.group.subgroups || []).find(subgroup => subgroup.id === data.subgroupId) || null;
    if (data.subgroupId && !subgroup)
      return { error: true, message: 'Invalid subgroup provided' };

    // check time
    if (data.startTime < cycle.startDate || data.endTime > cycle.endDate)
      return { error: true, message: 'Training must be within cycle start and end date' };

    return { error: false, data: { cycle, subgroup } };
  }

  async create(user: User, data: Partial<Training> & { componentIds: string[] }): Promise<Training> {
    this.logger.debug(`Creating training for user ${user.uid}: ${JSON.stringify(data)}`);

    const { error, message } = await this.validate(user, data);
    if (error) throw new BadRequestException(message);

    // create training
    const training = await this.repository.create({
      cycleId: data.cycleId,
      subgroupId: data.subgroupId || null,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // check that all components exist
    const { componentIds } = data;
    await this.componentService.findAllOrFail({ ids: data.componentIds });

    const setGroups = await this.setService.initializeTraining(training.id, componentIds);
    return { ...training, setGroups };
  }

  async update(user: User, id: string, data: Partial<Training>): Promise<Training> {
    const { error, message } = await this.validate(user, data);
    if (error) throw new BadRequestException(message);

    const training = await this.repository.update(id, {
      startTime: Timestamp.fromDate(data.startTime) as unknown as Date,
      endTime: Timestamp.fromDate(data.endTime) as unknown as Date,
    });

    return await this.populate(training);
  }

  async copy(user: User, data: CopyTrainingDto): Promise<Training> {
    this.logger.debug(`Copying training for user ${user.uid}: ${JSON.stringify(data)}`);

    const found = await this.repository.findOneByIdOrFail(data.trainingId);
    const training: Partial<Training> = {
      id: data.trainingId,
      cycleId: data.cycleId || data.cycleId,
      subgroupId: data.subgroupId || found.subgroupId || null,
      startTime: found.startTime,
      endTime: found.endTime,
    };

    const { error, message, data: { cycle, subgroup } } = await this.validate(user, training);
    if (error) throw new BadRequestException(message);

    // copy training
    const newTraining = await this.repository.create({
      cycleId: cycle.id,
      subgroupId: subgroup?.id || null,
      startTime: training.startTime,
      endTime: training.endTime,
    });

    // copy sets
    const setGroups = await this.setService.copyTraining(user, found, newTraining.id);
    return { ...newTraining, setGroups };
  }

  async remove(user: User, id: string) {
    this.logger.debug(`Deleting training for user ${user.uid}: ${id}`);

    const training = await this.repository.findOneByIdOrFail(id);
    await this.canView(user, training.cycleId);

    await this.setService.deleteAllByTrainingId(id);
    await this.repository.delete(id);
  }
}
