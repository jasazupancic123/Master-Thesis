import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '../../common/decorator/entity.decorator';
import { SetExerciseEntity, SetExerciseRelations } from '../entity/set-exercise.entity';
import { FirestoreRepository } from '../../firebase/firestore.repository';
import { CustomClaims } from '../../common/type/custom-claims.type';
import { ExerciseInfoService } from '../../exercise-info/service/exercise-info.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { ExerciseService } from '../../exercise/exercise.service';
import { SuperExerciseInfoService } from '../../exercise-info/service/super-exercise-info.service';
import { DateFilterDto } from '../../common/dto/date-filter.dto';

@Injectable()
export class SetExerciseService {
  constructor(
    @InjectRepository(SetExerciseEntity)
    private readonly repository: FirestoreRepository<SetExerciseEntity>,
    private readonly firebaseService: FirebaseService,
    private readonly exerciseService: ExerciseService,
    private readonly superExerciseInfoService: SuperExerciseInfoService,
    private readonly exerciseInfoService: ExerciseInfoService,
  ) {
  }

  getRepository() {
    return this.repository;
  }

  async findOneById(user: CustomClaims, id: string) {
    const setExercise = await this.repository.findOneById(id);
    return await this.populate(user, setExercise, ['exercise', 'exerciseInfo']);
  }

  async findOneByIdOrFail(user: CustomClaims, id: string) {
    const setExercise = await this.findOneById(user, id);
    if (!setExercise)
      throw new BadRequestException('Set exercise not found');

    return setExercise;
  }

  async findAll(user: CustomClaims, filter: FindAllFilter) {
    const items = await this
      .repository
      .getCollection()
      .where('setSubgroupId', 'in', filter.setSubgroupIds)
      .get();

    return await Promise.all(items.docs.map(async (doc) => {
      const item = this.repository.serialize(doc);
      return this.populate(user, item, ['exercise', 'exerciseInfo', 'superExerciseInfo']);
    }));
  }

  async findAllByExerciseId(user: CustomClaims, exerciseId: string, filter?: DateFilterDto) {
    let query = this.repository.getCollection().where('exerciseId', '==', exerciseId);

    const { from, to } = filter || {};
    if (from) query = query.where('createdAt', '>=', from);
    if (to) query = query.where('createdAt', '<=', to);

    const items = await query.get();

    return await Promise.all(items.docs.map(async (doc) => {
      const item = this.repository.serialize(doc);
      return this.populate(user, item, ['exercise', 'exerciseInfo', 'superExerciseInfo']);
    }));
  }

  private async populate(user: CustomClaims, item: SetExerciseEntity, relations: (keyof SetExerciseRelations)[]) {
    if (relations.includes('exercise'))
      item.exercise = await this.exerciseService.findOneByIdOrFail(user, item.exerciseId);

    // if user is athlete, return only his exercise info, otherwise return all for the cycle
    if (relations.includes('exerciseInfo')) {
      const exerciseInfo = await this.exerciseInfoService.findAllBySetExercise(item);
      if (this.firebaseService.isAthlete(user))
        item.exerciseInfo = [exerciseInfo.filter((info) => info.userId === user.uid)[0]];
      else if (this.firebaseService.isTrainer(user))
        item.exerciseInfo = exerciseInfo;
    }

    if (relations.includes('superExerciseInfo'))
      item.superExerciseInfo = await this.superExerciseInfoService.findOneBySetExerciseId(user, item.id);

    return item;
  }
}

interface FindAllFilter {
  setSubgroupIds: string[];
}