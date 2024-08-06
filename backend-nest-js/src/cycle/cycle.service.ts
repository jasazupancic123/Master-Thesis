import { forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { CycleDto, Week } from './dto/cycle.dto';
import { CustomClaims } from '../common/type/custom-claims.type';
import { GroupService } from '../group/group.service';
import { TrainingService } from '../training/training.service';
import dayjs from 'dayjs';
import { isDateBetween } from '../common/util/date';
import { Wrapper } from '../common/type/wrapper.type';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { GroupDto } from '../group/dto/group.dto';
import { TrainingEntity } from '../training/entity/training.entity';

@Injectable()
export class CycleService {
  private logger: Logger;

  constructor(
    private readonly firebaseService: FirebaseService,
    @InjectRepository(CycleDto) private readonly repository: FirestoreRepository<CycleDto>,
    private readonly groupService: GroupService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {
    this.logger = new Logger(CycleService.name);
  }

  async create(user: CustomClaims, data: CreateCycleDto) {
    const { groupId, name, description, startDate, endDate } = data;

    // check if group exists
    const group = await this.groupService.findOneById(user, groupId);

    this.logger.debug(`Creating cycle for user ${user.uid}`);
    const cycle = await this.repository.create({
      groupId,
      name,
      description,
      startDate,
      endDate,
    });

    return this.populate(cycle, { group });
  }

  async findAll(user: CustomClaims, groupId: string) {
    // check if group exists
    const group = await this.groupService.findOneById(user, groupId);
    const cycles = await this.repository.getCollection().where('groupId', '==', groupId).get();

    return cycles.docs.map((cycle) => {
      const item = this.repository.serialize(cycle);
      return this.populate(item, { group });
    });
  }

  async findOneById(user: CustomClaims, id: string) {
    const cycle = await this.repository.findOneById(id);
    if (!cycle)
      return null;

    // check if cycle's group contains user
    const group = await this.groupService.findOneById(user, cycle.groupId);
    const trainings = await this.trainingService.findAll(user, cycle);

    return this.populate(cycle, { group, trainings });
  }

  async findOneByIdOrFail(user: CustomClaims, id: string) {
    const cycle = await this.repository.findOneByIdOrFail(id);

    // check if cycle's group contains user
    const group = await this.groupService.findOneById(user, cycle.groupId);
    const trainings = await this.trainingService.findAll(user, cycle);

    return this.populate(cycle, { group, trainings });
  }

  async update(user: CustomClaims, id: string, data: UpdateCycleDto) {
    const { name, startDate, endDate } = data;

    // check if cycle exists
    const cycle = await this.findOneByIdOrFail(user, id);

    // check if current user is cycle's group owner
    if (!this.isOwner(user, cycle))
      throw new UnauthorizedException();

    const updated = await this.repository.update(id, {
      name,
      startDate,
      endDate,
    });

    const { group, trainings } = cycle;
    return this.populate(updated, { group, trainings });
  }

  async remove(user: CustomClaims, id: string) {
    // check if cycle exists
    const cycle = await this.findOneByIdOrFail(user, id);

    // check if current user is cycle's group owner
    if (!this.isOwner(user, cycle))
      throw new UnauthorizedException();

    await this.repository.delete(id);
  }

  isOwner(user: CustomClaims, cycle: CycleDto): boolean {
    return cycle.group.userId === user.uid;
  }

  private populate(
    item: CycleDto,
    relations: {
      group?: GroupDto,
      trainings?: TrainingEntity[]
    } = {},
  ): CycleDto {
    item.group = relations.group;
    item.trainings = relations.trainings || [];

    let weeks: Week[][] = [];
    const start = dayjs(item.startDate);
    const end = dayjs(item.endDate);

    let startDateWeekStart = start.startOf('week').add(1, 'day');
    let endDateWeekEnd = end.endOf('week').add(1, 'day');

    // if start day is sunday, subtract 7 days
    if (start.day() === 0) {
      startDateWeekStart = startDateWeekStart.subtract(7, 'day');
      endDateWeekEnd = endDateWeekEnd.subtract(7, 'day');
    }

    const totalDays = endDateWeekEnd.diff(startDateWeekStart, 'day') + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    let date = startDateWeekStart;
    for (let i = 0; i < totalWeeks; i++) {
      const week: Week[] = Array(7).fill(null);

      for (let day = 0; day < 7; day++) {
        const filtered = item.trainings.filter(training =>
          isDateBetween(dayjs(training.startTime), date.startOf('day'), date.endOf('day')));

        week[day] = {
          date: date.toDate(),
          isTrainingDay: isDateBetween(date, start, end),
          trainings: filtered,
        };

        date = date.add(1, 'day');
      }

      weeks.push(week);
    }

    item.weeks = weeks;
    return item;
  }
}