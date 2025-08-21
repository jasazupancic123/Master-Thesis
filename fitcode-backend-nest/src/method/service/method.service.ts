import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Query } from 'firebase-admin/firestore';

import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { Create } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import { MethodRef } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { CACHE_KEY_METHODS } from '../constant/cache.constant';
import { Method } from '../entity/method.entity';
import { MethodRepository } from '../repository/method.repository';

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
    const method = await this.repository.findById(ref.methodId);
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

    return cached ? cached : await this.repository.findAll();
  }

  async create(user: User, input: Create<Method>): Promise<Method> {
    const {
      id,
      name,
      componentId,
      ability,
      intensity,
      attributes: limits,
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
      componentId,
      ability,
      intensity,
      repetition,
      set,
      attributes: limits,
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
