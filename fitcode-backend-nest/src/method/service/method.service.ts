import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { MethodRepository } from '../repository/method.repository';
import { Query } from 'firebase-admin/firestore';
import { User } from '../../common/type/firebase-auth.type';
import { Method } from '../entity/method.entity';
import { MethodRef } from '../../common/type/firestore.type';
import { Create } from '../../common/type/entity.type';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { CACHE_KEY_METHODS } from '../constant/cache.constant';

@Injectable()
export class MethodService {
  private logger = new Logger(MethodService.name);

  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly firebaseService: FirebaseService,
    private readonly repository: MethodRepository,
  ) {}

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return query(this.repository.collection()).get();
  }

  async findOne(ref: MethodRef): Promise<Method | null> {
    // find method
    const method = await this.repository.getDoc(ref.methodId);
    if (!method) return null;

    return method;
  }

  async findOneOrFail(ref: MethodRef): Promise<Method> {
    const method = await this.findOne(ref);
    if (!method) throw new BadRequestException('Method not found');
    return method;
  }

  async findAll(): Promise<Method[]> {
    const cached =
      await this.cacheManagerService.get<Method[]>(CACHE_KEY_METHODS);

    return cached ? cached : await this.repository.getDocs();
  }

  async create(user: User, input: Create<Method>): Promise<Method> {
    const {
      id,
      name,
      targetId,
      ability,
      intensity,
      attributeRanges: limits,
      tempo,
      recovery,
      repetition,
      set,
    } = input;

    this.logger.log(`User ${user.uid} is creating a method`);

    if (!this.firebaseService.isAdmin(user))
      throw new UnauthorizedException(
        'You are not authorized to create a method',
      );

    await this.cacheManagerService.del(CACHE_KEY_METHODS);
    const data: Create<Method> = {
      id,
      name,
      targetId,
      ability,
      intensity,
      repetition,
      set,
      attributeRanges: limits,
      tempo,
      recovery,
    };

    const methodDocRef = this.repository.collection().doc(id);
    const method: Method = {
      ...data,
      id: methodDocRef.id,
    };

    const createMethodQuery = this.firebaseService.buildCreateQuery<Method>({
      ...data,
      id: methodDocRef.id,
    });

    const batch = this.firebaseService.firestore.batch();
    batch.set(methodDocRef, createMethodQuery);

    await batch.commit();

    return method;
  }
}
