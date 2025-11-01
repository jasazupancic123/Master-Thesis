import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeType } from '@src/attribute/enum/attribute-type.enum';
import { TEMPO_REGEX } from '@src/common/constant/tempo-regex.constant';
import type {
  ExerciseParamField,
  ExerciseSet,
} from '@src/training/entity/exercise-set.entity';

export const DEFAULT_PARAMS_KEY = 'default';

const REPS: Attribute<ExerciseSet> = {
  field: 'reps',
  name: 'Reps',
  description: 'repetitions',
  type: AttributeType.Number,
  defaultValue: 10,
  required: true,
};

const REC_TIME: Attribute<ExerciseSet> = {
  field: 'recTime',
  name: 'Rec Time',
  description: 'recovery time between sets',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60,
};

const REC_DIST: Attribute<ExerciseSet> = {
  field: 'recDist',
  name: 'Rec Distance',
  description: 'recovery distance between intervals',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: 100,
};

const KG: Attribute<ExerciseSet> = {
  field: 'loadKg',
  name: 'Load',
  description: 'load',
  unit: 'kg',
  type: AttributeType.Number,
  defaultValue: 50,
};

const BW: Attribute<ExerciseSet> = {
  field: 'loadBw',
  name: 'Load',
  description: 'load',
  unit: '%',
  type: AttributeType.Number,
  defaultValue: 50,
};

const RM: Attribute<ExerciseSet> = {
  field: 'loadRm',
  name: 'Load',
  description: 'load',
  type: AttributeType.Number,
  defaultValue: 75,
};

const TEMPO: Attribute<ExerciseSet> = {
  field: 'tempo',
  name: 'Tempo',
  description: 'tempo',
  type: AttributeType.String,
  defaultValue: '2:0:1:0',
  pattern: TEMPO_REGEX, // e.g. "2:0:1:0", meaning "eccentric:isometric:concentric:isometric" in seconds
};

const TIME: Attribute<ExerciseSet> = {
  field: 'time',
  name: 'Time',
  description: 'time',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60,
};

const DIST: Attribute<ExerciseSet> = {
  field: 'dist',
  name: 'Distance',
  description: 'distance',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: 30,
};

const EFF: Attribute<ExerciseSet> = {
  field: 'eff',
  name: 'Effort',
  description: 'effort',
  type: AttributeType.Number,
  defaultValue: 2,
  min: 1, // easy
  max: 4, // max
};

const VEL: Attribute<ExerciseSet> = {
  field: 'vel',
  name: 'VBT',
  description: 'velocity based training',
  unit: 'm/s',
  type: AttributeType.Number,
  defaultValue: 1,
};

export const ExerciseParamAttribute: Record<
  ExerciseParamField,
  Attribute<ExerciseSet>
> = {
  reps: REPS,
  repsR: { ...REPS, required: false },
  loadKg: KG,
  loadKgR: KG,
  loadBw: BW,
  loadBwR: BW,
  loadRm: RM,
  loadRmR: RM,
  tempo: TEMPO,
  tempoR: TEMPO,
  vel: VEL,
  velR: VEL,
  time: TIME,
  dist: DIST,
  eff: EFF,
  recTime: REC_TIME,
  recDist: REC_DIST,
};
