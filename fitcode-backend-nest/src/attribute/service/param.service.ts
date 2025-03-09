import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AttributeRepository } from '../repository/attribute.repository';
import { Attribute } from '../entity/attribute.entity';
import { Create } from '../../common/type/entity.type';
import { ParamRepository } from '../repository/param.repository';

@Injectable()
export class ParamService {
  private logger = new Logger(ParamService.name);

  constructor(private readonly repository: ParamRepository) {}

  async create(data: Create<Attribute>): Promise<Attribute> {
    this.logger.debug(`Creating param with data ${JSON.stringify(data)}`);
    await this.repository.addDoc(data);
    return data;
  }

  async findOneBySlug(slug: string): Promise<Attribute> {
    return await this.repository.getDoc(slug);
  }

  async findOneBySlugOrFail(slug: string): Promise<Attribute> {
    const item = await this.repository.getDoc(slug);
    if (!item) throw new BadRequestException('Param not found');
    return item;
  }

  async findAll(): Promise<Attribute[]> {
    return await this.repository.getDocs();
  }
}
