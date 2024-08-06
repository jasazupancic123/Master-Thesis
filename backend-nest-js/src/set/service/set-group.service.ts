import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '../../common/decorator/entity.decorator';
import { FirestoreRepository } from '../../firebase/firestore.repository';
import { SetGroupEntity } from '../entity/set-group.entity';
import { CustomClaims } from '../../common/type/custom-claims.type';
import { SetSubgroupService } from './set-subgroup.service';

@Injectable()
export class SetGroupService {
  constructor(
    @InjectRepository(SetGroupEntity)
    private readonly repository: FirestoreRepository<SetGroupEntity>,
    private readonly setSubgroupService: SetSubgroupService,
  ) {
  }

  getRepository() {
    return this.repository;
  }

  async findOneByIdOrFail(user: CustomClaims, id: string) {
    const set = await this.repository.findOneById(id);
    if (!set)
      throw new NotFoundException('Set not found');

    return set;
  }

  async findAll(user: CustomClaims, filter: FindAllFilter) {
    const data = await this.repository.getCollection()
      .where('trainingId', '==', filter.trainingId)
      .get();

    const serialized = data.docs.map((doc) => this.repository.serialize(doc));
    return await Promise.all(serialized.map(async (item) => {
      item.setSubgroups = await this.setSubgroupService.findAll(user, { setGroupId: item.id });
      return item;
    }));
  }
}

interface FindAllFilter {
  trainingId: string;
}