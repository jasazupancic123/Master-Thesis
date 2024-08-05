import { Injectable } from '@nestjs/common';
import { InjectRepository } from '../../common/decorator/entity.decorator';
import { FirestoreRepository } from '../../firebase/firestore.repository';
import { SetSubgroupEntity } from '../entity/set-subgroup.entity';
import { CustomClaims } from '../../common/type/custom-claims.type';
import { SetExerciseService } from './set-exercise.service';

@Injectable()
export class SetSubgroupService {
  constructor(
    @InjectRepository(SetSubgroupEntity)
    private readonly repository: FirestoreRepository<SetSubgroupEntity>,
    private readonly setExerciseService: SetExerciseService,
  ) {
  }

  getRepository() {
    return this.repository;
  }

  async findOneById(id: string) {
    return this.repository.findOneById(id);
  }

  async findAll(user: CustomClaims, filter: FindAllFilter) {
    const data = await this.repository.getCollection()
      .where('setGroupId', '==', filter.setGroupId)
      .get();

    const serialized = data.docs.map((doc) => this.repository.serialize(doc));
    return await Promise.all(serialized.map(async (item) => {
      item.setExercises = await this.setExerciseService.findAll(user, { setSubgroupIds: [item.id] });
      return item;
    }));
  }
}

interface FindAllFilter {
  setGroupId: string;
}