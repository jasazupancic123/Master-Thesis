import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WellnessRepository } from '../repository/wellness.repository';
import { UserRef } from '../../common/type/firebase-firestore.type';
import { CreateWellness } from '../type/wellness.type';
import { Wellness } from '../entity/wellness.entity';
import { Filter, FindManyOptions } from '../../common/type/orm.type';
import { Query, Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class WellnessService {
  private readonly logger = new Logger(WellnessService.name);

  constructor(private readonly wellnessRepository: WellnessRepository) {}

  async findAll(
    ref: Required<UserRef>,
    options?: FindManyOptions<Wellness>,
  ): Promise<Wellness[]> {
    return await this.wellnessRepository.getDocs(ref, (collection) => {
      let query = collection;
      if (options?.filter) query = this.filter(query, options.filter);
      return query;
    });
  }

  async findLastNDays(ref: Required<UserRef>, n: number): Promise<Wellness[]> {
    return await this.wellnessRepository.getDocs(ref, (collection) => {
      let query = collection;
      query = query.orderBy('createdAt', 'desc').limit(n);
      return query;
    });
  }

  async findToday(ref: Required<UserRef>): Promise<Wellness | null> {
    return await this.wellnessRepository.getToday(ref);
  }

  async create(
    ref: Required<UserRef>,
    input: CreateWellness,
  ): Promise<Wellness> {
    this.logger.debug(`Creating wellness for user (${ref.uid})`);
    const id = await this.wellnessRepository.addDoc(ref, input);

    const found = await this.wellnessRepository.getToday(ref);
    if (found)
      throw new BadRequestException(
        'You already submitted your wellness for today',
      );

    return {
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
      id,
    };
  }

  private filter(query: Query, filter: Filter<Wellness>): Query {
    if (filter.createdAt)
      query = query.where(
        'createdAt',
        filter.createdAt.op || '>=',
        Timestamp.fromDate(filter.createdAt.value),
      );

    return query;
  }
}
