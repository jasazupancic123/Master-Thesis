import { BadRequestException, forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { CustomClaims } from '../common/type/custom-claims.type';
import { TrainingFilterDto } from './dto/training-filter.dto';
import { CycleService } from '../cycle/cycle.service';
import { firestore } from 'firebase-admin';
import { TrainingEntity, TrainingRelations } from './entity/training.entity';
import { ComponentService } from '../component/component.service';
import { CycleDto } from '../cycle/dto/cycle.dto';
import { SetGroupEntity } from './entity/set-group.entity';
import { ExerciseService } from '../exercise/exercise.service';
import { Wrapper } from '../common/type/wrapper.type';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { CommonService } from '../common/service/common.service';
import { SetExerciseService } from './service/set-exercise.service';
import { ExerciseInfoService } from './service/exercise-info.service';
import { SetGroupService } from './service/set-group.service';
import { SetSubgroupService } from './service/set-subgroup.service';
import { AddExerciseToSetSubgroupDto } from './dto/create-set-exercise.dto';
import { SuperExerciseInfoService } from './service/super-exercise-info.service';
import { SuperExerciseInfoEntity } from './entity/super-exercise-info.entity';

@Injectable()
export class TrainingService {
  private logger: Logger;

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(TrainingEntity)
    private readonly repository: FirestoreRepository<TrainingEntity>,
    private readonly setGroupService: SetGroupService,
    private readonly setSubgroupService: SetSubgroupService,
    private readonly setExerciseService: SetExerciseService,
    private readonly exerciseInfoService: ExerciseInfoService,
    private readonly superExerciseInfoService: SuperExerciseInfoService,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => CycleService)) private readonly cycleService: Wrapper<CycleService>,
  ) {
    this.logger = new Logger(TrainingService.name);
  }

  async findOneById(user: CustomClaims, id: string) {
    return await this.repository.findOneById(id);
  }

  async findOneByIdOrFail(user: CustomClaims, id: string) {
    return await this.repository.findOneByIdOrFail(id);
  }

  async findAll(user: CustomClaims, cycle: CycleDto, filter?: TrainingFilterDto) {
    const startTimestamp = firestore.Timestamp.fromDate(filter?.startDate || cycle.startDate);
    const endTimestamp = firestore.Timestamp.fromDate(filter?.endDate || cycle.endDate);

    const trainings = await this.repository.getCollection()
      .where('cycleId', '==', cycle.id)
      .where('startTime', '>=', startTimestamp)
      .where('endTime', '<=', endTimestamp)
      .orderBy('startTime')
      .get();

    // convert to promise.all
    return await Promise.all(trainings.docs.map(async training => {
      const item = this.repository.serialize(training);
      const setGroups = await this.setGroupService.findAll(user, { trainingId: item.id });
      const components = await this.componentService.findAll({ ids: setGroups.map(({ componentId }) => componentId) });
      return this.populate(item, { setGroups, components });
    }));
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
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // check that all components exist
    const components = await this.componentService.findAll({ ids: data.componentIds });
    if (!components.length || components.length !== data.componentIds.length)
      throw new BadRequestException('Some components are invalid');

    // each training component represents one set group
    const setGroups: SetGroupEntity[] = [];
    for (let i = 0; i < components.length; i++) {
      const setGroup = await this.addSetGroup(user, {
        trainingId: training.id,
        componentId: components[i].id,
        order: i,
      });

      setGroups.push(setGroup);
    }

    // TODO - automatically create warmup and cooldown sets

    return { components, setGroups };
  }

  async addSetGroup(user: CustomClaims, data: Partial<SetGroupEntity>): Promise<SetGroupEntity> {
    const setGroup = await this.setGroupService.getRepository().create({
      trainingId: data.trainingId,
      componentId: data.componentId,
      order: data.order,
    });

    // for each set group, create 3 set subgroups (representing supersets)
    setGroup.setSubgroups = await this.setSubgroupService.getRepository().createMany([
      { setGroupId: setGroup.id, order: 0, color: this.commonService.getRandomColor() },
      { setGroupId: setGroup.id, order: 1, color: this.commonService.getRandomColor() },
      { setGroupId: setGroup.id, order: 2, color: this.commonService.getRandomColor() },
    ]);

    return setGroup;
  }

  async addExerciseToSetSubgroup(user: CustomClaims, data: AddExerciseToSetSubgroupDto & { setSubgroupId: string }) {
    this.logger.debug(`Creating exercise for set subgroup: ${JSON.stringify(data)}`);
    const { setSubgroupId, exerciseIds, order, ...superExerciseInfoData } = data;

    // check that entities exist
    const setSubgroup = await this.setSubgroupService.getRepository().findOneByIdOrFail(setSubgroupId);
    const setGroup = await this.setGroupService.getRepository().findOneByIdOrFail(setSubgroup.setGroupId);
    const training = await this.repository.findOneByIdOrFail(setGroup.trainingId);
    const cycle = await this.cycleService.findOneByIdOrFail(user, training.cycleId);

    // check that exercises are valid
    const exercises = await this.exerciseService.findAll(user, { ids: exerciseIds });
    if (!exerciseIds.length || exerciseIds.length !== exercises.length)
      throw new BadRequestException('Invalid exercises');

    // check that exercises leaf component ids belongs to training's root component ids
    const valid = this.exerciseService.isValidSetGroupExercise(user, exercises, setGroup);
    if (!valid)
      throw new BadRequestException('Invalid exercises');

    // create set exercise
    const setExercises = await this.setExerciseService.getRepository().createMany(exerciseIds.map(exerciseId => ({
      setSubgroupId: setSubgroup.id,
      exerciseId,
      order,
    })));

    // create super exercise info for trainers
    const superExerciseInfos = await this.superExerciseInfoService.getRepository().createMany(
      setExercises.map(setExercise => ({
        ...superExerciseInfoData,
        setExerciseId: setExercise.id,
      } as SuperExerciseInfoEntity)),
    );

    // create exercise info for each exercise for each user in cycle
    const exerciseInfos = await Promise.all(setExercises.map((setExercise, i) => {
      const superExerciseInfo = superExerciseInfos[i];
      return this.exerciseInfoService.createManyForCycle(user, setExercise, cycle, superExerciseInfo);
    }));

    return setExercises.map(setExercise => ({
      ...setExercise,
      setSubgroup,
      exercise: exercises.find(exercise => exercise.id === setExercise.exerciseId),
      exerciseInfo: exerciseInfos.flat(),
      superExerciseInfo: superExerciseInfos.find(superExerciseInfo => superExerciseInfo.setExerciseId === setExercise.id),
    }));
  }

  async update(user: CustomClaims, id: string, data: UpdateTrainingDto) {
    const training = await this.repository.findOneByIdOrFail(id);

    // check that user is owner of cycle
    const cycle = await this.cycleService.findOneById(user, training.cycleId);
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
    await this.repository.findOneByIdOrFail(id);
    await this.repository.delete(id);
  }

  populate(item: TrainingEntity, relations: Partial<TrainingRelations>) {
    item.setGroups = relations.setGroups;
    item.components = relations.components;
    return item;
  }
}
