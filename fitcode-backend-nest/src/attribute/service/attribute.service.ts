import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AttributeRepository } from '../repository/attribute.repository';
import { Attribute } from '../entity/attribute.entity';
import { Create } from '../../common/type/entity.type';
import { AttributeValue } from '../entity/attribute-value.entity';
import { AttributeType } from '../../common/enum/attribute-type.enum';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { CACHE_KEY_ATTRIBUTES } from '../constant/cache.constant';

@Injectable()
export class AttributeService {
  private logger = new Logger(AttributeService.name);

  constructor(
    private readonly repository: AttributeRepository,
    private readonly cacheManagerService: CacheManagerService,
  ) {}

  async create(data: Create<Attribute>): Promise<Attribute> {
    this.logger.debug(`Creating attribute with data ${JSON.stringify(data)}`);
    await this.repository.addDoc(data);
    await this.cacheManagerService.del(CACHE_KEY_ATTRIBUTES);
    return data;
  }

  async findOneBySlug(slug: string): Promise<Attribute> {
    return await this.repository.getDoc(slug);
  }

  async findOneBySlugOrFail(slug: string): Promise<Attribute> {
    const item = await this.repository.getDoc(slug);
    if (!item) throw new BadRequestException('Attribute not found');
    return item;
  }

  async findAll(): Promise<Attribute[]> {
    const cached =
      await this.cacheManagerService.get<Attribute[]>(CACHE_KEY_ATTRIBUTES);

    return cached ? cached : await this.repository.getDocs();
  }

  validate(values: AttributeValue[], attributes: Attribute[]) {
    const vals: AttributeValue[] = [];

    for (const attribute of attributes) {
      const attributeValues = values.filter(
        (val) => val.field === attribute.field,
      );

      if (
        attribute.required &&
        (attributeValues[0]?.value === null ||
          attributeValues[0]?.value === undefined)
      )
        throw new BadRequestException(
          `Attribute "${attribute.name}" is required`,
        );

      if (
        attribute.type !== AttributeType.Multiselect &&
        attributeValues.length > 1
      )
        throw new BadRequestException(
          `Attribute "${attribute.name} cannot have multiple values`,
        );

      for (const v of attributeValues) {
        if (attribute.required && (v.value === null || v.value === undefined))
          throw new BadRequestException(
            `Attribute "${attribute.name}" is required`,
          );

        switch (attribute.type) {
          case AttributeType.String:
            if (typeof v.value !== 'string')
              throw new BadRequestException(
                `Value for attribute "${attribute.name}" must be a string`,
              );

            break;
          case AttributeType.Number:
            if (isNaN(+v.value))
              throw new BadRequestException(
                `Value for attribute "${attribute.name}" must be a number`,
              );

            break;
          case AttributeType.Boolean:
            if (v.value !== 'true' && v.value !== 'false')
              throw new BadRequestException(
                `Value for attribute "${attribute.name}" must be a boolean`,
              );

            break;
          case AttributeType.Select:
          case AttributeType.Multiselect:
            if (!attribute.options || attribute.options.length === 0)
              throw new BadRequestException(
                `Attribute "${attribute.name}" has no valid options`,
              );

            const matchedAttribute = this.validateSelection(
              v.selected,
              attribute.options,
            ); // returns leaf attribute of options, so its not select or multiselect type anymore and we can recurse this validate function to check it again

            if (!matchedAttribute)
              throw new BadRequestException(
                `Value "${v.selected}" for attribute "${attribute.name}" is not a valid option`,
              );

            // validate leafs for custom types
            switch (matchedAttribute.type) {
              case AttributeType.Number:
                if (isNaN(+v.value))
                  throw new BadRequestException(
                    `Value for attribute "${attribute.name}" must be a number`,
                  );

                break;
              case AttributeType.Boolean:
                if (v.value !== 'true' && v.value !== 'false')
                  throw new BadRequestException(
                    `Value for attribute "${attribute.name}" must be a boolean`,
                  );

                break;
            }

            break;
          default:
            break;
        }

        vals.push(v);
      }
    }

    return vals;
  }

  private validateSelection(
    selectedPath: string,
    options: Attribute[],
  ): Attribute | null {
    const pathParts = selectedPath.split(':');
    let currentOptions = options;

    let found: Attribute;
    for (const part of pathParts) {
      found = currentOptions.find((opt) => opt.field === part);

      if (!found) return null;
      if (found.options) currentOptions = found.options || [];
      else break;
    }

    return found;
  }
}
