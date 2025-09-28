import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Query } from 'firebase-admin/firestore';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { AttributeType } from '@src/common/enum/attribute-type.enum';
import { ValidateError } from '@src/common/type/validate.type';
import { Component } from '@src/component/entity/component.entity';

import { BodyRegion } from '../constant/body-region.constant';
import { Category } from '../constant/category.constant';
import { Equipment } from '../constant/equipment.constant';
import { LiftPriority } from '../constant/lift-priority.constant';
import { LoadingSide } from '../constant/loading-side.constant';
import { Location } from '../constant/location.constant';
import { MovementDirection } from '../constant/movement-direction.constant';
import { Pattern } from '../constant/patterns.constant';
import { PrescriptionType } from '../constant/prescription-type.constant';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { Exercise } from '../entity/exercise.entity';
import { ExerciseAttributes } from '../entity/exercise-attributes.entity';

@Injectable()
export class ExerciseAttributeService {
  constructor(private readonly attributeService: AttributeService) {}

  validate(
    input: CreateExerciseDto,
    data: { components: Component[] },
    onError?: (error: ValidateError<Exercise>) => void,
  ) {
    const field: keyof CreateExerciseDto = 'componentIds';

    // validate components
    if (input.componentIds.length < 1) {
      const message = 'Exercise must have at least one component';
      if (onError) {
        onError({ field, message });
        return [];
      }

      throw new BadRequestException(message);
    }

    for (const componentId of input.componentIds) {
      const component = data.components.find((c) => c.id === componentId);
      if (!component) {
        // check that component exists
        const message = `Component ${componentId} does not exist`;
        if (onError) {
          onError({ field, message });
          return [];
        }

        throw new NotFoundException(message);
      }
    }

    // check that component is leaf
    const mainComponent = data.components.find(
      (c) => c.id === input.componentIds[0],
    )!;

    if (mainComponent.children?.length > 0) {
      // main component must be leaf
      const message = `Main component ${mainComponent.name.toLowerCase()} is not valid for an exercise`;
      if (onError) {
        onError({ field, message });
        return [];
      }

      throw new BadRequestException(message);
    }

    const attributes = this.getAttributes();
    const values = this.getValues(input as Exercise);

    return this.attributeService.validate(
      values,
      attributes,
      onError
        ? (error: ValidateError) => {
            onError({
              field: error.field as keyof CreateExerciseDto,
              message: error.message,
            });
          }
        : undefined,
    );
  }

  getAttributes(): Attribute[] {
    return [
      {
        field: 'categories',
        name: 'Categories',
        type: AttributeType.Multiselect,
        options: Category,
      },
      {
        field: 'equipment',
        name: 'Equipment',
        type: AttributeType.Multiselect,
        options: Equipment,
      },
      {
        field: 'prescriptions',
        name: 'Prescriptions',
        type: AttributeType.Multiselect,
        options: PrescriptionType,
      },
      {
        field: 'patterns',
        name: 'Patterns',
        type: AttributeType.Multiselect,
        options: Pattern,
      },
      {
        field: 'bodyRegions',
        name: 'Body Regions',
        type: AttributeType.Multiselect,
        options: BodyRegion,
      },
      {
        field: 'loadingSides',
        name: 'Loading Sides',
        type: AttributeType.Multiselect,
        options: LoadingSide,
      },
      {
        field: 'locations',
        name: 'Locations',
        type: AttributeType.Multiselect,
        options: Location,
      },
      {
        field: 'liftPriorities',
        name: 'Lift Priorities',
        type: AttributeType.Multiselect,
        options: LiftPriority,
      },
      {
        field: 'movementDirections',
        name: 'Movement Directions',
        type: AttributeType.Multiselect,
        options: MovementDirection,
      },
    ];
  }

  getValues(exercise: Partial<ExerciseAttributes>): AttributeValue[] {
    const categoryValues: AttributeValue[] =
      exercise.categories?.map((c) => ({
        field: 'categories',
        ...this.attributeService.parseSelectedValue(c),
      })) || [];

    const equipmentValues: AttributeValue[] =
      exercise.equipment?.map((e) => ({
        field: 'equipment',
        ...this.attributeService.parseSelectedValue(e),
      })) || [];

    const prescriptionValues: AttributeValue[] =
      exercise.prescriptions?.map((p) => ({
        field: 'prescriptions',
        selected: '',
        value: p,
      })) || [];

    const patternValues: AttributeValue[] =
      exercise.patterns?.map((p) => ({
        field: 'patterns',
        selected: '',
        value: p,
      })) || [];

    const bodyRegionValues: AttributeValue[] =
      exercise.bodyRegions?.map((b) => ({
        field: 'bodyRegions',
        selected: '',
        value: b,
      })) || [];

    const loadingSideValues: AttributeValue[] =
      exercise.loadingSides?.map((l) => ({
        field: 'loadingSides',
        selected: '',
        value: l,
      })) || [];

    const locationValues: AttributeValue[] =
      exercise.locations?.map((l) => ({
        field: 'locations',
        selected: '',
        value: l,
      })) || [];

    const liftPriorityValues: AttributeValue[] =
      exercise.liftPriorities?.map((l) => ({
        field: 'liftPriorities',
        selected: '',
        value: l,
      })) || [];

    const movementDirectionValues: AttributeValue[] =
      exercise.movementDirections?.map((m) => ({
        field: 'movementDirections',
        selected: '',
        value: m,
      })) || [];

    return this.attributeService.uniqueValues([
      ...categoryValues,
      ...prescriptionValues,
      ...patternValues,
      ...bodyRegionValues,
      ...equipmentValues,
      ...loadingSideValues,
      ...locationValues,
      ...liftPriorityValues,
      ...movementDirectionValues,
    ]);
  }

  applyFilters(query: Query, filter?: Record<string, string>): Query {
    if (!filter) return query;

    const filters = Object.entries(filter);
    if (filters.length === 0) return query;
    if (filters.length > 1)
      throw new BadRequestException('Only one filter can be applied at a time');

    for (const [key, value] of filters) {
      switch (key) {
        case 'category':
          query = query.where('categories', 'array-contains', value);
          break;
        case 'equipment':
          query = query.where('equipment', 'array-contains', value);
          break;
        case 'prescription':
          query = query.where('prescriptions', 'array-contains', value);
          break;
        case 'pattern':
          query = query.where('patterns', 'array-contains', value);
          break;
        case 'bodyRegion':
          query = query.where('bodyRegions', 'array-contains', value);
          break;
        case 'loadingSide':
          query = query.where('loadingSides', 'array-contains', value);
          break;
        case 'location':
          query = query.where('locations', 'array-contains', value);
          break;
        case 'liftPriority':
          query = query.where('liftPriorities', 'array-contains', value);
          break;
        case 'movementDirection':
          query = query.where('movementDirections', 'array-contains', value);
          break;
      }
    }

    return query;
  }
}
