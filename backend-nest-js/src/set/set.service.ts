import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { SetGroup } from './entity/set-group.entity';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { SetSubgroup } from './entity/set-subgroup.entity';
import { SetExercise } from './entity/set-exercise.entity';
import { User } from '../common/type/custom-claims.type';
import { CommonService } from '../common/service/common.service';
import { ExerciseInfoService } from '../exercise-info/exercise-info.service';
import { Wrapper } from '../common/type/wrapper.type';
import { TrainingService } from '../training/training.service';
import { ExerciseService } from '../exercise/exercise.service';
import { SuperExerciseInfo } from '../exercise-info/entity/super-exercise-info.entity';
import { Exercise } from '../exercise/entity/exercise.entity';
import { Training } from '../training/entity/training.entity';

@Injectable()
export class SetService {
  private readonly logger = new Logger(SetService.name);

  constructor(
    private readonly commonService: CommonService,
    @InjectRepository(SetExercise)
    private readonly setExerciseRepository: FirestoreRepository<SetExercise>,
    @InjectRepository(SetSubgroup)
    private readonly setSubgroupRepository: FirestoreRepository<SetSubgroup>,
    @InjectRepository(SetGroup)
    private readonly setGroupRepository: FirestoreRepository<SetGroup>,
    private readonly exerciseInfoService: ExerciseInfoService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => TrainingService)) private readonly trainingService: Wrapper<TrainingService>,
  ) {
  }

  async findExerciseBySetExerciseId(user: User, setExerciseId: string): Promise<Exercise> {
    const setExercise = await this.setExerciseRepository.findOneByIdOrFail(setExerciseId);
    return await this.exerciseService.findOneByIdOrFail(user, setExercise.exerciseId);
  }

  async findAllSetGroupsByTrainingId(trainingId: string): Promise<SetGroup[]> {
    return await this.setGroupRepository.findAllBy('trainingId', trainingId, {
      order: { order: 'asc' },
    });
  }

  /**
   * Each training can have many components. This function creates a separate
   * set group for each component (where only exercises from that component can
   * be added), and 3 set subgroups for each set group (representing supersets).
   */
  async initializeTraining(trainingId: string, componentIds: string[]): Promise<SetGroup[]> {
    // each training component represents one set group
    const setGroups: SetGroup[] = [];
    for (let order = 0; order < componentIds.length; order++) {
      const componentId = componentIds[order];
      const setGroup = await this.createSetGroup({ trainingId, componentId, order });
      setGroups.push(setGroup);
    }

    return setGroups;
  }

  async copyTraining(user: User, training: Training, newTrainingId: string): Promise<SetGroup[]> {
    const oldSetGroups = await this.findAllSetGroupsByTrainingId(training.id);
    const group = await this.trainingService.findGroup(user, training);

    // copy all set groups
    const newSetGroups: SetGroup[] = [];
    for (const oldSetGroup of oldSetGroups) {
      const newSetGroup = await this.setGroupRepository.create({
        trainingId: newTrainingId,
        componentId: oldSetGroup.componentId,
        order: oldSetGroup.order,
      });

      // copy all set subgroups ("supersets")
      const oldSetSubgroups = await this.setSubgroupRepository.findAllBy('setGroupId', oldSetGroup.id, {
        order: { order: 'asc' },
      });

      for (const oldSetSubgroup of oldSetSubgroups) {
        const newSetSubgroup = await this.setSubgroupRepository.create({
          setGroupId: newSetGroup.id,
          order: oldSetSubgroup.order,
          color: oldSetSubgroup.color,
        });

        // copy all set exercises for each superset
        const oldSetExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', oldSetSubgroup.id, {
          order: { order: 'asc' },
        });

        for (const oldSetExercise of oldSetExercises) {
          const newSetExercise = await this.setExerciseRepository.create({
            setSubgroupId: newSetSubgroup.id,
            exerciseId: oldSetExercise.exerciseId,
            order: oldSetExercise.order,
          });

          // copy super exercise info and exercise info
          const { superExerciseInfo } = await this.exerciseInfoService.findInfoBySetExerciseId(oldSetExercise.id);
          await this.exerciseInfoService.create(user, newSetExercise.id, group.members, {
            ...superExerciseInfo,
            setExerciseId: newSetExercise.id,
          });
        }
      }

      newSetGroups.push(newSetGroup);
    }

    return newSetGroups.sort((a, b) => a.order - b.order);
  }

  async createSetGroup(data: Partial<SetGroup>): Promise<SetGroup> {
    const setGroup = await this.setGroupRepository.create(data);

    // for each set group, create 3 set subgroups (representing supersets)
    const setGroupId = setGroup.id;
    setGroup.setSubgroups = await this.setSubgroupRepository.createMany([
      { setGroupId, order: 0, color: this.commonService.color.random() },
      { setGroupId, order: 1, color: this.commonService.color.random() },
      { setGroupId, order: 2, color: this.commonService.color.random() },
    ]);

    setGroup.setSubgroups = setGroup.setSubgroups.sort((a, b) => a.order - b.order);
    return setGroup;
  }

  /**
   * Set subgroup denotes a superset. Each set subgroup (superset) can have many
   * exercises. Each exercise has its own super exercise info (weight, reps, ...),
   * and for each member in the group, exercise info entry is created that holds
   * relative data (bodyweight, 1RM, ...) for that member.
   */
  async addExercisesToSetGroup(
    user: User,
    setSubgroupId: string,
    exerciseIds: string[],
    data: Partial<SuperExerciseInfo>,
  ): Promise<SetExercise[]> {
    this.logger.debug(`Creating exercise for set subgroup: ${JSON.stringify(data)}`);

    // find all entities
    const setSubgroup = await this.setSubgroupRepository.findOneByIdOrFail(setSubgroupId);
    const setGroup = await this.setGroupRepository.findOneByIdOrFail(setSubgroup.setGroupId);
    const cycle = await this.trainingService.findCycle(user, setGroup.trainingId);

    // check that exercises are valid
    const exercises = await this.exerciseService.findAll(user, { filter: { ids: exerciseIds } });

    if (!exerciseIds.length || exerciseIds.length !== exercises.length)
      throw new BadRequestException('Invalid exercises');

    // check that exercises can be added to the training set group
    const valid = this.exerciseService.isValid(user, setGroup, exercises);
    if (!valid)
      throw new BadRequestException('Invalid exercises');

    // create set exercise
    const order = await this.getSetExerciseOrder(setSubgroup);
    const setExercises = await this.setExerciseRepository.createMany(exerciseIds.map((exerciseId, i) => ({
      setSubgroupId,
      exerciseId,
      order: order + i,
    })));

    // create exercise info for each member
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
        setSubgroup: setSubgroup,
      };
    });
  }

  async updateExercise(
    user: User,
    setExerciseId: string,
    data: Partial<SuperExerciseInfo> & { order?: number },
  ): Promise<SetExercise> {
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

  async findSetGroupById(user: User, setGroupId: string) {
    // find set group
    const setGroup = await this.setGroupRepository.findOneById(setGroupId);

    // find all set subgroups
    const setSubgroups = await this.setSubgroupRepository.findAllBy('setGroupId', setGroup.id);

    for (const setSubgroup of setSubgroups) {
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

    setGroup.setSubgroups = setSubgroups;
    return setGroup;
  }

  async findAllSetExercisesBySubgroupId(user: User, setSubgroupId: string) {
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

  async findAllSetExercisesByMemberAndExerciseId(member: User, exerciseId: string) {
    const setExercises = await this.setExerciseRepository.findAllBy('exerciseId', exerciseId);

    return await Promise.all(setExercises.map(async (setExercise) => {
      const exercise = await this.exerciseService.findOneByIdOrFail(member, setExercise.exerciseId);
      const {
        superExerciseInfo,
        exerciseInfo,
      } = await this.exerciseInfoService.findInfoBySetExerciseId(setExercise.id, { memberId: member.uid });

      return {
        ...setExercise,
        exercise,
        superExerciseInfo,
        exerciseInfo,
      } as SetExercise;
    }));
  }

  /**
   * Delete all set groups and set subgroups for a training.
   */
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

  /**
   * Delete all set exercises for a set subgroup, but keep exercise info intact
   * (for user history and statistics).
   */
  private async deleteSubgroupExercises(setSubgroupId: string) {
    const setExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', setSubgroupId);
    for (const setExercise of setExercises)
      await this.setExerciseRepository.delete(setExercise.id);
  }

  private async getSetExerciseOrder(setSubgroup: SetSubgroup) {
    const setExercises = await this.setExerciseRepository.findAllBy('setSubgroupId', setSubgroup.id);
    return setExercises.length;
  }
}