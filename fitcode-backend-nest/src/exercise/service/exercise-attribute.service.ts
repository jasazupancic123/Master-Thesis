import { BadRequestException, Injectable } from '@nestjs/common';
import { Query } from 'firebase-admin/firestore';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeType } from '@src/attribute/enum/attribute-type.enum';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { ValidateError } from '@src/common/type/validate.type';

import { BodyRegion } from '../constant/body-region.constant';
import { Components } from '../constant/components.constant';
import { Equipment } from '../constant/equipment.constant';
import { LiftPriority } from '../constant/lift-priority.constant';
import { LoadingSide } from '../constant/loading-side.constant';
import { Location } from '../constant/location.constant';
import { MovementDirection } from '../constant/movement-direction.constant';
import { Pattern } from '../constant/patterns.constant';
import { PrescriptionType } from '../constant/prescription-type.constant';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { Component } from '../entity/component.entity';
import { Exercise } from '../entity/exercise.entity';
import { ExerciseAttributes } from '../entity/exercise-attributes.entity';

@Injectable()
export class ExerciseAttributeService {
  constructor(private readonly attributeService: AttributeService) {}

  validate(
    input: CreateExerciseDto,
    onError?: (error: ValidateError<Exercise>) => void,
  ): AttributeValue<ExerciseAttributes>[] {
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

  getAttributes(): Attribute<ExerciseAttributes>[] {
    return [
      {
        field: 'components',
        name: 'Components',
        type: AttributeType.Multiselect,
        options: Components,
        required: true,
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

  getValues(
    exercise: Partial<ExerciseAttributes>,
  ): AttributeValue<ExerciseAttributes>[] {
    const componentValues: AttributeValue<ExerciseAttributes>[] =
      exercise.components?.map((c) => ({
        field: 'components',
        ...this.attributeService.parseSelectedValue(c),
      })) || [];

    const equipmentValues: AttributeValue<ExerciseAttributes>[] =
      exercise.equipment?.map((e) => ({
        field: 'equipment',
        ...this.attributeService.parseSelectedValue(e),
      })) || [];

    const prescriptionValues: AttributeValue<ExerciseAttributes>[] =
      exercise.prescriptions?.map((p) => ({
        field: 'prescriptions',
        value: p as string,
      })) || [];

    const patternValues: AttributeValue<ExerciseAttributes>[] =
      exercise.patterns?.map((p) => ({
        field: 'patterns',
        value: p as string,
      })) || [];

    const bodyRegionValues: AttributeValue<ExerciseAttributes>[] =
      exercise.bodyRegions?.map((b) => ({
        field: 'bodyRegions',
        value: b as string,
      })) || [];

    const loadingSideValues: AttributeValue<ExerciseAttributes>[] =
      exercise.loadingSides?.map((l) => ({
        field: 'loadingSides',
        value: l as string,
      })) || [];

    const locationValues: AttributeValue<ExerciseAttributes>[] =
      exercise.locations?.map((l) => ({
        field: 'locations',
        value: l as string,
      })) || [];

    const liftPriorityValues: AttributeValue<ExerciseAttributes>[] =
      exercise.liftPriorities?.map((l) => ({
        field: 'liftPriorities',
        value: l as string,
      })) || [];

    const movementDirectionValues: AttributeValue<ExerciseAttributes>[] =
      exercise.movementDirections?.map((m) => ({
        field: 'movementDirections',
        value: m as string,
      })) || [];

    return this.attributeService.uniqueValues([
      ...componentValues,
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
      const parsed = value.split(',').map((v) => v.trim());
      switch (key) {
        case 'component':
          query = query.where('components', 'array-contains-any', parsed);
          break;
        case 'equipment':
          query = query.where('equipment', 'array-contains-any', parsed);
          break;
        case 'prescription':
          query = query.where('prescriptions', 'array-contains-any', parsed);
          break;
        case 'pattern':
          query = query.where('patterns', 'array-contains-any', parsed);
          break;
        case 'bodyRegion':
          query = query.where('bodyRegions', 'array-contains-any', parsed);
          break;
        case 'loadingSide':
          query = query.where('loadingSides', 'array-contains-any', parsed);
          break;
        case 'location':
          query = query.where('locations', 'array-contains-any', parsed);
          break;
        case 'liftPriority':
          query = query.where('liftPriorities', 'array-contains-any', parsed);
          break;
        case 'movementDirection':
          query = query.where(
            'movementDirections',
            'array-contains-any',
            parsed,
          );
          break;
      }
    }

    return query;
  }

  /**
   * Get the root main component of an exercise. For example, if the component is
   * 'strength:corrective:spine', it will return the 'strength' component attribute.
   */
  getRootMainComponent(component: string): Component | null {
    return this.attributeService.getRoot(
      component,
      Components,
    ) as Component | null;
  }

  isRootComponent(component: string): boolean {
    return Components.some((c) => c.field === component);
  }
}
