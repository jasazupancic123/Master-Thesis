import { Injectable } from '@nestjs/common';
import { InjectRepository } from '../../common/decorator/entity.decorator';
import { ExerciseInfoEntity } from '../entity/exercise-info.entity';
import { FirestoreRepository } from '../../firebase/firestore.repository';
import { SetExerciseEntity } from '../entity/set-exercise.entity';
import { CustomClaims } from '../../common/type/custom-claims.type';
import { CycleDto } from '../../cycle/dto/cycle.dto';
import { SuperExerciseInfoEntity } from '../entity/super-exercise-info.entity';
import { WorkloadType } from '../enum/workload-type.enum';

@Injectable()
export class ExerciseInfoService {
  constructor(
    @InjectRepository(ExerciseInfoEntity)
    private readonly repository: FirestoreRepository<ExerciseInfoEntity>,
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

  async createManyForCycle(
    user: CustomClaims,
    setExercise: SetExerciseEntity,
    cycle: CycleDto,
    data: SuperExerciseInfoEntity,
  ) {
    const memberIds = cycle.group.memberIds || [];

    // create exercise info for all members in the cycle
    const input: ExerciseInfoEntity[] = memberIds.map((userId) => {
      let value: number;
      switch (data.workloadType) {
        case WorkloadType.RM:
          // TODO - fetch 1RM from last month of user exercises, use formula and save value as KG
          value = data.workloadValue;
          break;
        case WorkloadType.BW:
          // TODO - fetch body weight from user's profile and save % of it as KG
          value = data.workloadValue;
          break;
        case WorkloadType.INT:
        case WorkloadType.KG:
        default:
          value = data.workloadValue;
      }

      return {
        userId,
        superExerciseInfoId: setExercise.id,
        value,
      } as ExerciseInfoEntity;
    });

    return await this.repository.createMany(input);
  }
}