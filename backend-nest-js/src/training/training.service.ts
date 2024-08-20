import { BadRequestException, forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { CustomClaims } from '../common/type/custom-claims.type';
import { TrainingFilterDto } from './dto/training-filter.dto';
import { CycleService } from '../cycle/cycle.service';
import { firestore } from 'firebase-admin';
import { TrainingEntity } from './entity/training.entity';
import { ComponentService } from '../component/component.service';
import { CycleDto } from '../cycle/dto/cycle.dto';
import { ExerciseService } from '../exercise/exercise.service';
import { Wrapper } from '../common/type/wrapper.type';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { CommonService } from '../common/service/common.service';
import { SetService } from '../set/set.service';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly commonService: CommonService,
    @InjectRepository(TrainingEntity)
    private readonly repository: FirestoreRepository<TrainingEntity>,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => CycleService)) private readonly cycleService: Wrapper<CycleService>,
    @Inject(forwardRef(() => SetService)) private readonly setService: Wrapper<SetService>,
  ) {
  }

  async findOneById(user: CustomClaims, id: string) {
    return await this.repository.findOneById(id);
  }

  async findOneByIdOrFail(user: CustomClaims, id: string) {
    return await this.repository.findOneByIdOrFail(id);
  }

  async findAll(user: CustomClaims, cycle: CycleDto, filter?: TrainingFilterDto) {
    let query = this.repository
      .getCollection()
      .where('cycleId', '==', cycle.id)
      .where('subgroupId', '==', filter?.subgroupId || null);

    if (filter?.startDate)
      query = query.where('startTime', '>=', firestore.Timestamp.fromDate(filter.startDate));

    if (filter?.endDate)
      query = query.where('endTime', '<=', firestore.Timestamp.fromDate(filter.endDate));

    const trainings = await query.orderBy('startTime').get();
    return await Promise.all(trainings.docs.map(async item => {
      return this.setService.populateTraining(user, this.repository.serialize(item));
    }));
  }

  async populateCycleAndGroup(user: CustomClaims, trainingId: string) {
    const training = await this.findOneByIdOrFail(user, trainingId);
    return await this.cycleService.findOneByIdOrFail(user, training.cycleId);
  }

  async create(user: CustomClaims, data: CreateTrainingDto) {
    this.logger.debug(`Creating training for user ${user.uid}: ${JSON.stringify(data)}`);

    // check that user is owner of cycle
    const cycle = await this.cycleService.findOneByIdOrFail(user, data.cycleId);
    if (!this.cycleService.isOwner(user, cycle))
      throw new UnauthorizedException('You are not authorized to create training for this cycle');

    // check that training is within cycle start and end date
    if (data.startTime < cycle.startDate || data.endTime > cycle.endDate)
      throw new BadRequestException('Training must be within cycle start and end date');

    // create training
    const training = await this.repository.create({
      cycleId: data.cycleId,
      subgroupId: data.subgroupId || null,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // check that all components exist
    const components = await this.componentService.findAllOrFail({ ids: data.componentIds });
    const setGroups = await this.setService.initializeTraining(user, training.id, components.map(component => component.id));
    return { ...training, setGroups };
  }

  async update(user: CustomClaims, id: string, data: UpdateTrainingDto) {
    const training = await this.repository.findOneByIdOrFail(id);

    // check that user is owner of cycle
    const cycle = await this.cycleService.findOneByIdOrFail(user, training.cycleId);
    if (!cycle)
      throw new BadRequestException('Cycle does not exist');

    if (!this.cycleService.isOwner(user, cycle))
      throw new UnauthorizedException('You are not authorized to update training for this cycle');

    /*await training.ref.update({
      startTime: firestore.Timestamp.fromDate(data.startTime),
      endTime: firestore.Timestamp.fromDate(data.endTime),
    });*/

    await this.repository.update(id, {
      startTime: firestore.Timestamp.fromDate(data.startTime) as unknown as Date,
      endTime: firestore.Timestamp.fromDate(data.endTime) as unknown as Date,
    });

    return await this.repository.findOneById(id);
  }

  async remove(user: CustomClaims, id: string) {
    this.logger.debug(`Deleting training for user ${user.uid}: ${id}`);

    // check if user is owner of cycle
    const training = await this.repository.findOneByIdOrFail(id);
    await this.cycleService.findOneByIdOrFail(user, training.cycleId);

    await this.setService.deleteAllByTrainingId(id);
    await this.repository.delete(id);
  }
}
