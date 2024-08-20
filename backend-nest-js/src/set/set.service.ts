import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { SetGroupEntity } from './entity/set-group.entity';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { SetSubgroupEntity } from './entity/set-subgroup.entity';
import { SetExerciseEntity } from './entity/set-exercise.entity';
import { CustomClaims } from '../common/type/custom-claims.type';
import { CommonService } from '../common/service/common.service';
import { TrainingEntity } from '../training/entity/training.entity';
import { ExerciseInfoService } from '../exercise-info/exercise-info.service';
import { Wrapper } from '../common/type/wrapper.type';
import { TrainingService } from '../training/training.service';
import { ExerciseService } from '../exercise/exercise.service';
import { SuperExerciseInfoEntity } from '../exercise-info/entity/super-exercise-info.entity';

@Injectable()
export class SetService {
  private readonly logger = new Logger(SetService.name);

  constructor(
    private readonly commonService: CommonService,
    @InjectRepository(SetExerciseEntity)
    private readonly setExerciseRepository: FirestoreRepository<SetExerciseEntity>,
    @InjectRepository(SetSubgroupEntity)
    private readonly setSubgroupRepository: FirestoreRepository<SetSubgroupEntity>,
    @InjectRepository(SetGroupEntity)
    private readonly setGroupRepository: FirestoreRepository<SetGroupEntity>,
    private readonly exerciseInfoService: ExerciseInfoService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => TrainingService)) private readonly trainingService: Wrapper<TrainingService>,
  ) {
  }

  async findExerciseBySetExerciseId(user: CustomClaims, setExerciseId: string) {
    const setExercise = await this.setExerciseRepository.findOneByIdOrFail(setExerciseId);
    return await this.exerciseService.findOneByIdOrFail(user, setExercise.exerciseId);
  }

  /**
   * Each training can have many components. This function creates a separate
   * set group for each component (where only exercises from that component can
   * be added), and 3 set subgroups for each set group (representing supersets).
   */
  async initializeTraining(
    user: CustomClaims,
    trainingId: string,
    componentIds: string[],
  ) {
    // each training component represents one set group
    const setGroups: SetGroupEntity[] = [];
    for (let order = 0; order < componentIds.length; order++) {
      const componentId = componentIds[order];
      const setGroup = await this.createSetGroup({ trainingId, componentId, order });
      setGroups.push(setGroup);
    }

    return setGroups;
  }

  async createSetGroup(data: Partial<SetGroupEntity>): Promise<SetGroupEntity> {
    this.logger.debug(`Creating set group: ${JSON.stringify(data)}`);
    const setGroup = await this.setGroupRepository.create(data);

    // for each set group, create 3 set subgroups (representing supersets)
    const setGroupId = setGroup.id;
    setGroup.setSubgroups = await this.setSubgroupRepository.createMany([
      { setGroupId, order: 0, color: this.commonService.getRandomColor() },
      { setGroupId, order: 1, color: this.commonService.getRandomColor() },
      { setGroupId, order: 2, color: this.commonService.getRandomColor() },
    ]);

    // TODO - for first subgroup, create warmup and cooldown sets

    return setGroup;
  }

  async addExercise(
    user: CustomClaims,
    setSubgroupId: string,
    exerciseIds: string[],
    data: Partial<SuperExerciseInfoEntity>,
  ): Promise<SetExerciseEntity[]> {
    this.logger.debug(`Creating exercise for set subgroup: ${JSON.stringify(data)}`);

    // find all entities
    const subgroup = await this.setSubgroupRepository.findOneByIdOrFail(setSubgroupId);
    const group = await this.setGroupRepository.findOneByIdOrFail(subgroup.setGroupId);
    const cycle = await this.trainingService.populateCycleAndGroup(user, group.trainingId);

    // check that exercises are valid
    const exercises = await this.exerciseService.findAll(user, { ids: exerciseIds });
    if (!exerciseIds.length || exerciseIds.length !== exercises.length)
      throw new BadRequestException('Invalid exercises');

    // check that exercises leaf component ids belongs to training's root component ids
    const valid = this.exerciseService.isValidSetGroupExercise(user, exercises, group);
    if (!valid)
      throw new BadRequestException('Invalid exercises');

    // create set exercise
    const order = await this.getSetExerciseOrder(subgroup);
    const setExercises = await this.setExerciseRepository.createMany(exerciseIds.map((exerciseId, i) => ({
      setSubgroupId,
      exerciseId,
      order: order + i,
    })));

    // create exercise info
    const members = cycle.group.members || [];
    const infos = await Promise.all(setExercises.map(async (setExercise) =>
      await this.exerciseInfoService.create(user, setExercise.id, members, data),
    ));

    return setExercises.map((setExercise) => {
      const exercise = exercises.find(({ id }) => id === setExercise.exerciseId);
      const info = infos[infos.findIndex(({ superExerciseInfo }) => superExerciseInfo.setExerciseId === setExercise.id)];

      return {
        ...setExercise,
        exercise,
        superExerciseInfo: info.superExerciseInfo,
        exerciseInfo: info.exerciseInfo,
        setSubgroup: subgroup,
      };
    });
  }

  async updateExercise(
    user: CustomClaims,
    setExerciseId: string,
    data: Partial<SuperExerciseInfoEntity> & { order?: number },
  ): Promise<SetExerciseEntity> {
    this.logger.debug(`Updating exercise (${setExerciseId}): ${JSON.stringify(data)}`);

    // update order if provided
    const setExercise = await this.setExerciseRepository.findOneByIdOrFail(setExerciseId);
    if (data.order)
      await this.setExerciseRepository.update(setExerciseId, { order: data.order });

    const exercise = await this.exerciseService.findOneByIdOrFail(user, setExercise.exerciseId);
    const {
      superExerciseInfo,
      exerciseInfo,
    } = await this.exerciseInfoService.findInfoBySetExerciseId(setExercise.id);

    // update exercise info
    await this.exerciseInfoService.update(setExerciseId, data);

    return {
      ...setExercise,
      exercise,
      superExerciseInfo,
      exerciseInfo,
    };
  }

  async getSetGroup(user: CustomClaims, setGroupId: string) {
    // find set group
    const setGroup = await this.setGroupRepository.findOneById(setGroupId);

    // find all subgroups
    const subgroups = await this.setSubgroupRepository.findAllBy('setGroupId', setGroup.id);

    for (const subgroup of subgroups) {
      subgroup.setExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', subgroup.id);

      for (const setExercise of subgroup.setExercises) {
        const {
          superExerciseInfo,
          exerciseInfo,
        } = await this.exerciseInfoService.findInfoBySetExerciseId(setExercise.id);

        setExercise.superExerciseInfo = superExerciseInfo;
        setExercise.exerciseInfo = exerciseInfo;
        setExercise.exercise = await this.exerciseService.findOneByIdOrFail(user, setExercise.exerciseId);
      }
    }

    setGroup.setSubgroups = subgroups;
    return setGroup;
  }

  async findAllSetExercisesBySubgroupId(user: CustomClaims, setSubgroupId: string) {
    const setExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', setSubgroupId);

    return await Promise.all(setExercises.map(async (setExercise) => {
      const exercise = await this.exerciseService.findOneByIdOrFail(user, setExercise.exerciseId);
      const {
        superExerciseInfo,
        exerciseInfo,
      } = await this.exerciseInfoService.findInfoBySetExerciseId(setExercise.id);

      return {
        ...setExercise,
        exercise,
        superExerciseInfo,
        exerciseInfo,
      };
    }));
  }

  async findAllSetExercisesByMemberAndExerciseId(member: CustomClaims, exerciseId: string) {
    const setExercises = await this.setExerciseRepository.findAllBy('exerciseId', exerciseId);

    return await Promise.all(setExercises.map(async (setExercise) => {
      const exercise = await this.exerciseService.findOneByIdOrFail(member, setExercise.exerciseId);
      const {
        superExerciseInfo,
        exerciseInfo,
      } = await this.exerciseInfoService.findInfoBySetExerciseId(setExercise.id, { memberId: member.id });

      return {
        ...setExercise,
        exercise,
        superExerciseInfo,
        exerciseInfo,
      } as SetExerciseEntity;
    }));
  }

  async populateTraining(user: CustomClaims, training: TrainingEntity) {
    // TODO - convert to nested Promise.all
    training.setGroups = await this.setGroupRepository.findAllBy('trainingId', training.id);

    /*for (const setGroup of training.setGroups) {
      setGroup.setSubgroups = await this.setSubgroupRepository.findAllBy('setGroupId', setGroup.id);

      for (const setSubgroup of setGroup.setSubgroups) {
        setSubgroup.setExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', setSubgroup.id);

        for (const setExercise of setSubgroup.setExercises) {
          const {
            superExerciseInfo,
            exerciseInfo,
          } = await this.exerciseInfoService.findInfoBySetExerciseId(setExercise.id);

          setExercise.superExerciseInfo = superExerciseInfo;
          setExercise.exerciseInfo = exerciseInfo;
          setExercise.exercise = await this.exerciseService.findOneByIdOrFail(user, setExercise.exerciseId);
        }
      }
    }*/

    return training;
  }

  async deleteAllByTrainingId(trainingId: string) {
    const setGroups = await this.setGroupRepository.findAllBy('trainingId', trainingId);
    for (const setGroup of setGroups) {
      const setSubgroups = await this.setSubgroupRepository.findAllBy('setGroupId', setGroup.id);
      for (const setSubgroup of setSubgroups) {
        await this.deleteSubgroupExercises(setSubgroup.id);
        await this.setSubgroupRepository.delete(setSubgroup.id);
      }

      await this.setGroupRepository.delete(setGroup.id);
    }
  }

  private async deleteSubgroupExercises(setSubgroupId: string) {
    const setExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', setSubgroupId);
    for (const setExercise of setExercises) {
      await this.setExerciseRepository.delete(setExercise.id);
      await this.exerciseInfoService.deleteAllBySetExerciseId(setExercise.id);
    }
  }

  private async getSetExerciseOrder(setSubgroup: SetSubgroupEntity) {
    const setExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', setSubgroup.id);
    return setExercises.length;
  }
}