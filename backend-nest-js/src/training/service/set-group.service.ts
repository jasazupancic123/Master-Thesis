import { Injectable } from '@nestjs/common';
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

  async findOneById(id: string) {
    /*// find training and cycle
    const training = await this.findOneByIdOrFail(user, set.trainingId);
    const cycle = await this.cycleService.findOneByIdOrFail(user, training.cycleId);

    // check that user is owner of cycle
    if (!this.cycleService.isOwner(user, cycle))
      throw new UnauthorizedException('You are not authorized for this cycle');*/

    return this.repository.findOneById(id);
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