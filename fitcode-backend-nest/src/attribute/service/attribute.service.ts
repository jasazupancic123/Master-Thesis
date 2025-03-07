import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AttributeRepository } from '../repository/attribute.repository';
import { Attribute } from '../entity/attribute.entity';
import { Create } from '../../common/type/entity.type';

@Injectable()
export class AttributeService {
  private logger = new Logger(AttributeService.name);

  constructor(private readonly attributeRepository: AttributeRepository) {}

  async create(data: Create<Attribute>): Promise<Attribute> {
    this.logger.debug(`Creating attribute with data ${JSON.stringify(data)}`);
    await this.attributeRepository.addDoc(data);
    return data;
  }

  async findOneBySlug(slug: string): Promise<Attribute> {
    return await this.attributeRepository.getDoc(slug);
  }

  async findOneBySlugOrFail(slug: string): Promise<Attribute> {
    const item = await this.attributeRepository.getDoc(slug);
    if (!item) throw new BadRequestException('Attribute not found');
    return item;
  }

  async findAll(): Promise<Attribute[]> {
    return await this.attributeRepository.getDocs();
  }
}
