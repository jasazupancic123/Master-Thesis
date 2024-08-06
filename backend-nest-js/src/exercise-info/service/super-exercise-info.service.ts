import { Injectable } from '@nestjs/common';
import { InjectRepository } from '../../common/decorator/entity.decorator';
import { FirestoreRepository } from '../../firebase/firestore.repository';
import { SuperExerciseInfoEntity } from '../entity/super-exercise-info.entity';
import { CustomClaims } from '../../common/type/custom-claims.type';

@Injectable()
export class SuperExerciseInfoService {
  constructor(
    @InjectRepository(SuperExerciseInfoEntity)
    private readonly repository: FirestoreRepository<SuperExerciseInfoEntity>,
  ) {
  }

  getRepository() {
    return this.repository;
  }

  async findOneById(user: CustomClaims, id: string) {
    return await this.repository.findOneById(id);
  }

  async findOneBySetExerciseId(user: CustomClaims, setExerciseId: string) {
    return await this.repository.findOneByField('setExerciseId', setExerciseId);
  }
}