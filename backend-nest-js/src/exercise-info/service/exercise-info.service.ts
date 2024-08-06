import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '../../common/decorator/entity.decorator';
import { ExerciseInfoEntity } from '../entity/exercise-info.entity';
import { FirestoreRepository } from '../../firebase/firestore.repository';
import { SetExerciseEntity } from '../../set/entity/set-exercise.entity';
import { CycleDto } from '../../cycle/dto/cycle.dto';
import { SuperExerciseInfoEntity } from '../entity/super-exercise-info.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { CustomClaims } from '../../common/type/custom-claims.type';
import { CommonService } from '../../common/service/common.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class ExerciseInfoService {
  constructor(
    @InjectRepository(ExerciseInfoEntity)
    private readonly repository: FirestoreRepository<ExerciseInfoEntity>,
    private readonly commonService: CommonService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
  }

  getRepository() {
    return this.repository;
  }

  async findOneById(id: string) {
    // TODO - check if user is allowed to view this resource
    return await this.repository.findOneById(id);
  }

  async findAllBySetExercise(setExercise: SetExerciseEntity) {
    return await this.repository.getCollection()
      .where('setExerciseId', '==', setExercise.id)
      .get()
      .then(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ExerciseInfoEntity)));
  }

  async createMany(
    cycle: CycleDto,
    setExercise: SetExerciseEntity,
    superExerciseInfo: SuperExerciseInfoEntity,
  ) {
    const memberIds = cycle.group.memberIds || [];

    // create exercise info for all members in the cycle
    const input: ExerciseInfoEntity[] = memberIds.map((userId) => {
      return {
        setExerciseId: setExercise.id,
        superExerciseInfoId: superExerciseInfo.id,
        userId,
        completed: false,
        value: 0,
      };
    });

    return await this.repository.createMany(input);
  }

  async updateMany(
    user: CustomClaims,
    cycle: CycleDto,
    setExercise: SetExerciseEntity,
    superExerciseInfo: SuperExerciseInfoEntity,
  ) {
    // find all exercise infos by set exercise
    const exerciseInfos = await this.findAllBySetExercise(setExercise);

    // update all exercise infos
    const { workloadType, workloadValue } = superExerciseInfo;
    const input = await Promise.all(exerciseInfos.map(async (exerciseInfo) => ({
      id: exerciseInfo.id,
      data: {
        superExerciseInfoId: superExerciseInfo.id,
        completed: exerciseInfo.completed,
        value: await this.convertWorkloadValue(user, workloadType, workloadValue, setExercise.exerciseId),
      },
    })));

    return await this.repository.updateMany(input);
  }

  private async convertWorkloadValue(
    member: CustomClaims,
    type: WorkloadType,
    value: number,
    exerciseId: string,
  ) {
    switch (type) {
      case WorkloadType.RM:
        // fetch 1RM from last month of user exercises, use formula and save value as KG
        const oneRepMax = await this.getRepMax(member, exerciseId, value);
        return oneRepMax * this.commonService.percentFromValue(value);
      case WorkloadType.BW:
        // fetch body weight from user's profile and save % of it as KG
        const bodyweight = member.bodyweight || 0;
        return bodyweight * this.commonService.percentFromValue(value);
      case WorkloadType.INT:
      case WorkloadType.KG:
      default:
        return value;
    }
  }

}