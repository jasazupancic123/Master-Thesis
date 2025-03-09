import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AttributeRepository } from '../repository/attribute.repository';
import { Attribute } from '../entity/attribute.entity';
import { Create } from '../../common/type/entity.type';
import { AttributeValue } from '../entity/attribute-value.entity';
import { AttributeType } from '../../common/enum/attribute-type.enum';

@Injectable()
export class AttributeService {
  private logger = new Logger(AttributeService.name);

  constructor(private readonly repository: AttributeRepository) {}

  async create(data: Create<Attribute>): Promise<Attribute> {
    this.logger.debug(`Creating attribute with data ${JSON.stringify(data)}`);
    await this.repository.addDoc(data);
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
    return await this.repository.getDocs();
  }

  validate(values: AttributeValue[], attributes: Attribute[]) {
    const vals: AttributeValue[] = [];

    for (const attribute of attributes) {
      const v = values.find((v) => v.field === attribute.field);

      if (
        (attribute.required && !v?.value) ||
        (attribute.required && v?.selected?.length === 0)
      )
        throw new BadRequestException(
          `Attribute "${attribute.name}" is required`,
        );

      if (!v?.value) continue;

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
          const validSelected = this.validateSelectOptions(
            v.selected,
            attribute.options,
          );

          if (!validSelected) {
            throw new BadRequestException(
              `Value "${v.value}" for attribute "${attribute.name}" is not a valid option`,
            );
          }

          v.selected = validSelected;
          break;
        case AttributeType.Multiselect:
          // For multiselect, validate each selected value recursively
          for (const selectedValue of v.selected) {
            const splitValues = selectedValue.split('.');
            const isValid = this.checkNestedSelectOption(
              splitValues,
              attribute.options,
            );

            if (!isValid)
              throw new BadRequestException(
                `One or more selected values for attribute "${attribute.name}" are not valid options`,
              );
          }

          break;
      }

      vals.push(v);
    }

    return vals;
  }

  private validateSelectOptions(
    selected: string[],
    options: Attribute[] = [],
    isMultiselect: boolean = false,
  ): string[] | null {
    const validSelections: string[] = [];

    for (const selectedValue of selected) {
      const splitValues = selectedValue.split('.');
      const isValid = this.checkNestedSelectOption(splitValues, options);

      if (isValid) validSelections.push(selectedValue);
      else return null;
    }

    if (isMultiselect && validSelections.length === 0) return null;
    return validSelections.length > 0 ? validSelections : null;
  }

  // Helper function to recursively check nested select options
  private checkNestedSelectOption(
    splitValues: string[],
    options: Attribute[],
  ): boolean {
    let currentOptions = options;

    for (const value of splitValues) {
      const option = currentOptions.find(
        (opt) => opt.field === value && opt.type === AttributeType.Value,
      );

      if (option) {
        if (option.options) currentOptions = option.options;
      } else return false;
    }

    return true;
  }
}
