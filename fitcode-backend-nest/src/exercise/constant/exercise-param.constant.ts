import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { TEMPO_REGEX } from '@src/common/constant/tempo-regex.constant';
import { AttributeType } from '@src/common/enum/attribute-type.enum';
import type { ExerciseSet } from '@src/training/entity/exercise-set.entity';

export const DEFAULT_PARAMS_KEY = 'default';

export class ExerciseParam {
  static get(field: string): Attribute<ExerciseSet> | undefined {
    const mapper = {
      reps: this.REPS,
      repsR: { ...this.REPS, required: false },
      loadKg: this.KG,
      loadKgR: this.KG,
      loadBw: this.BW,
      loadBwR: this.BW,
      loadRm: this.RM,
      loadRmR: this.RM,
      tempo: this.TEMPO,
      tempoR: this.TEMPO,
      vel: this.VEL,
      velR: this.VEL,
      time: this.TIME,
      dist: this.DIST,
      eff: this.EFF,
      recTime: this.REC_TIME,
      recDist: this.REC_DIST,
    };

    return mapper[field];
  }

  static getAll(fields?: (keyof ExerciseSet)[]): Attribute<ExerciseSet>[] {
    const all = Object.values(ExerciseParam).filter(
      (attr) => typeof attr === 'object' && (attr as Attribute).field,
    ) as Attribute<ExerciseSet>[];

    return fields ? all.filter((attr) => fields.includes(attr.field)) : all;
  }

  static readonly pairs: (
    | [keyof ExerciseSet, keyof ExerciseSet]
    | [keyof ExerciseSet]
  )[] = [
    ['reps', 'repsR'],
    ['loadKg', 'loadKgR'],
    ['loadRm', 'loadRmR'],
    ['loadBw', 'loadBwR'],
    ['tempo', 'tempoR'],
    ['vel', 'velR'],
    ['eff'],
    ['time'],
    ['dist'],
    ['recTime'],
    ['recDist'],
  ];

  static readonly fields: (keyof ExerciseSet)[] = this.pairs.flat();

  static readonly primaryFields: (keyof ExerciseSet)[] = this.pairs.map(
    (pair) => pair[0],
  );

  static readonly secondaryFields: (keyof ExerciseSet)[] = this.pairs
    .filter((pair) => pair.length === 2)
    .map((pair) => pair[1]);

  static readonly REPS: Attribute<ExerciseSet> = {
    field: 'reps',
    name: 'Reps',
    description: 'repetitions',
    type: AttributeType.Number,
    defaultValue: 10,
    required: true,
  };

  static readonly REC_TIME: Attribute<ExerciseSet> = {
    field: 'recTime',
    name: 'Rec Time',
    description: 'recovery time between sets',
    unit: 's',
    type: AttributeType.Number,
    defaultValue: 60,
  };

  static readonly REC_DIST: Attribute<ExerciseSet> = {
    field: 'recDist',
    name: 'Rec Distance',
    description: 'recovery distance between intervals',
    unit: 'm',
    type: AttributeType.Number,
    defaultValue: 100,
  };

  static readonly KG: Attribute<ExerciseSet> = {
    field: 'loadKg',
    name: 'Load',
    description: 'load',
    unit: 'kg',
    type: AttributeType.Number,
    defaultValue: 50,
  };

  static readonly BW: Attribute<ExerciseSet> = {
    field: 'loadBw',
    name: 'Load',
    description: 'load',
    unit: '%',
    type: AttributeType.Number,
    defaultValue: 50,
  };

  static readonly RM: Attribute<ExerciseSet> = {
    field: 'loadRm',
    name: 'Load',
    description: 'load',
    type: AttributeType.Number,
    defaultValue: 75,
  };

  static readonly TEMPO: Attribute<ExerciseSet> = {
    field: 'tempo',
    name: 'Tempo',
    description: 'tempo',
    type: AttributeType.String,
    defaultValue: '2:0:1:0',
    pattern: TEMPO_REGEX, // e.g. "2:0:1:0", meaning "eccentric:isometric:concentric:isometric" in seconds
  };

  static readonly TIME: Attribute<ExerciseSet> = {
    field: 'time',
    name: 'Time',
    description: 'time',
    unit: 's',
    type: AttributeType.Number,
    defaultValue: 60,
  };

  static readonly DIST: Attribute<ExerciseSet> = {
    field: 'dist',
    name: 'Distance',
    description: 'distance',
    unit: 'm',
    type: AttributeType.Number,
    defaultValue: 30,
  };

  static readonly EFF: Attribute<ExerciseSet> = {
    field: 'eff',
    name: 'Effort',
    description: 'effort',
    type: AttributeType.Number,
    defaultValue: 2,
    min: 1, // easy
    max: 4, // max
  };

  static readonly VEL: Attribute<ExerciseSet> = {
    field: 'vel',
    name: 'VBT',
    description: 'velocity based training',
    unit: 'm/s',
    type: AttributeType.Number,
    defaultValue: 1,
  };
}
