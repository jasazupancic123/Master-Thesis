import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '../../common/decorator/entity.decorator';
import { SetExerciseEntity, SetExerciseRelations } from '../entity/set-exercise.entity';
import { FirestoreRepository } from '../../firebase/firestore.repository';
import { CustomClaims } from '../../common/type/custom-claims.type';
import { ExerciseInfoService } from './exercise-info.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { CycleService } from '../../cycle/cycle.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { ExerciseService } from '../../exercise/exercise.service';
import { SuperExerciseInfoService } from './super-exercise-info.service';

@Injectable()
export class SetExerciseService {
  constructor(
    @InjectRepository(SetExerciseEntity)
    private readonly repository: FirestoreRepository<SetExerciseEntity>,
    private readonly firebaseService: FirebaseService,
    private readonly exerciseInfoService: ExerciseInfoService,
    private readonly exerciseService: ExerciseService,
    private readonly superExerciseInfoService: SuperExerciseInfoService,
    @Inject(forwardRef(() => CycleService)) private readonly cycleService: Wrapper<CycleService>,
  ) {
  }

  getRepository() {
    return this.repository;
  }

  async findOneById(user: CustomClaims, id: string) {
    const setExercise = await this.repository.findOneById(id);
    return await this.populate(user, setExercise, ['exercise', 'exerciseInfo']);
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