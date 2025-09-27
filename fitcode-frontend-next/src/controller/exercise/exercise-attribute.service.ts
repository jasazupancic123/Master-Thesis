import { AttributeType } from '../attribute/enum/attribute-value.enum';
import type { Attribute } from '../attribute/type/attribute.type';
import type { Component } from '../component/type/component.type';
import { BodyRegion } from './constant/body-region.constant';
import { Category } from './constant/category.constant';
import { Equipment } from './constant/equipment.constant';
import { LiftPriority } from './constant/lift-priority.constant';
import { LoadingSide } from './constant/loading-side.constant';
import { Location } from './constant/location.constant';
import { MovementDirection } from './constant/movement-direction.constant';
import { Pattern } from './constant/pattern.constant';
import { PrescriptionType } from './constant/prescription.constant';
import type { ExerciseAttributes } from './type/exercise.type';

export class ExerciseAttributeService {
  static getAttributes(
    filter?: Component['attributes']
  ): Attribute<ExerciseAttributes>[] {
    const allAttributes: Attribute<ExerciseAttributes>[] = [
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

    if (!filter || !filter.length) return allAttributes;
    return allAttributes.filter(({ field }) => filter.includes(field));
  }

  /**
   * Flattens attribute tree into a mapping of parent -> all its direct children keys
   * Each child key is composed as `${parent}:${child}` recursively.
   *
   * @example
   * ```ts
   * const flattened = flatten(attributes);
   * // => {
   * //   "attribute1": ["attribute1:child1", "attribute1:child2:grandchild1", ...],
   * //   "attribute2": ["attribute2:child1", ...],
   * //   ...
   * // }
   * ```
   */
  static flatten(
    attributes: Attribute[],
    parentKey?: string
  ): Record<string, string[]> {
    const map: Record<string, string[]> = {};

    for (const attr of attributes) {
      const key = parentKey ? `${parentKey}:${attr.field}` : attr.field;

      if (attr.options && attr.options.length > 0) {
        const childrenKeys = attr.options.map((o) => `${key}:${o.field}`);
        map[key] = childrenKeys;

        // recurse into children
        const nested = this.flatten(attr.options, key);
        Object.assign(map, nested);
      }
    }

    return map;
  }

  /**
   * Get all descendant keys of a given parent.
   *
   * @example
   * ```ts
   * const descendants = getAllDescendants("attribute1", flattened);
   * // => ["attribute1:child1", "attribute1:child2", "attribute1:child2:grandchild1", ...]
   * ```
   */
  static getAllDescendants(
    key: string,
    flat: Record<string, string[]>
  ): string[] {
    const children = flat[key] ?? [];
    return children.reduce<string[]>(
      (acc, c) => [...acc, c, ...this.getAllDescendants(c, flat)],
      []
    );
  }

  static toggleSelection(
    selected: Set<string>,
    key: string,
    attributes: Attribute[]
  ): Set<string> {
    const next = new Set(selected);
    const flat = this.flatten(attributes);

    if (flat[key]) {
      // parent toggled
      const descendants = this.getAllDescendants(key, flat);
      const allSelected = descendants.every((c) => next.has(c));

      if (allSelected) descendants.forEach((c) => next.delete(c));
      else descendants.forEach((c) => next.add(c));
    } else {
      // leaf toggled
      if (next.has(key)) next.delete(key);
      else next.add(key);
    }

    return next;
  }

  static getSelectionState(
    selected: Set<string>,
    key: string,
    attributes: Attribute[]
  ) {
    const flat = this.flatten(attributes);
    const descendants = this.getAllDescendants(key, flat);

    if (descendants.length === 0)
      return selected.has(key) ? 'checked' : 'unchecked';

    const count = descendants.filter((c) => selected.has(c)).length;
    if (count === 0) return 'unchecked';
    if (count === descendants.length) return 'checked';
    return 'indeterminate';
  }
}
