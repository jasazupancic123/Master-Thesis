import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeType } from '@src/attribute/enum/attribute-type.enum';

export const MUSCLES_FRONT: Attribute[] = [
  {
    field: 'head',
    name: 'Head',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'head_upper',
        name: 'Head Upper',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'head_upper-r',
            name: 'Head Upper R',
            type: AttributeType.Number,
          },
          {
            field: 'head_upper-l',
            name: 'Head Upper L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'head_lower',
        name: 'Head Lower',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'head_lower-r',
            name: 'Head Lower R',
            type: AttributeType.Number,
          },
          {
            field: 'head_lower-l',
            name: 'Head Lower L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'neck',
    name: 'Neck',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'sternocleidomastoid',
        name: 'Sternocleidomastoid',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'sternocleidomastoid-r',
            name: 'Sternocleidomastoid R',
            type: AttributeType.Number,
          },
          {
            field: 'sternocleidomastoid-l',
            name: 'Sternocleidomastoid L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'longus_colli_longus_capitis',
        name: 'Longus Colli/Longus Capitis',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'longus_colli_longus_capitis-r',
            name: 'Longus Colli/Longus Capitis R',
            type: AttributeType.Number,
          },
          {
            field: 'longus_colli_longus_capitis-l',
            name: 'Longus Colli/Longus Capitis L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'scalenes',
        name: 'Scalenes',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'scalenes-r',
            name: 'Scalenes R',
            type: AttributeType.Number,
          },
          {
            field: 'scalenes-l',
            name: 'Scalenes L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'trapezius_front',
    name: 'Trapezius Front',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'trapezius_front-r',
        name: 'Trapezius Front R',
        type: AttributeType.Number,
      },
      {
        field: 'trapezius_front-l',
        name: 'Trapezius Front L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'deltoid_front',
    name: 'Deltoid Front',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'deltoid_anterior',
        name: 'Deltoid Anterior',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'deltoid_anterior-r',
            name: 'Deltoid Anterior R',
            type: AttributeType.Number,
          },
          {
            field: 'deltoid_anterior-l',
            name: 'Deltoid Anterior L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'deltoid_lateral_front',
        name: 'Deltoid Lateral Front',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'deltoid_lateral_front-r',
            name: 'Deltoid Lateral Front R',
            type: AttributeType.Number,
          },
          {
            field: 'deltoid_lateral_front-l',
            name: 'Deltoid Lateral Front L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'chest',
    name: 'Chest',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'seratus_anterior',
        name: 'Seratus Anterior',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'seratus_anterior-r',
            name: 'Seratus Anterior R',
            type: AttributeType.Number,
          },
          {
            field: 'seratus_anterior-l',
            name: 'Seratus Anterior L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'pectoralis_minor',
        name: 'Pectoralis Minor',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'pectoralis_minor-r',
            name: 'Pectoralis Minor R',
            type: AttributeType.Number,
          },
          {
            field: 'pectoralis_minor-l',
            name: 'Pectoralis Minor L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'pectoralis_major',
        name: 'Pectoralis Major',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'lower_pectoralis_major',
            name: 'Lower Pectoralis Major',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'lower_pectoralis_major-r',
                name: 'Lower Pectoralis Major R',
                type: AttributeType.Number,
              },
              {
                field: 'lower_pectoralis_major-l',
                name: 'Lower Pectoralis Major L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'mid_pectoralis_major',
            name: 'Mid Pectoralis Major',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'mid_pectoralis_major-r',
                name: 'Mid Pectoralis Major R',
                type: AttributeType.Number,
              },
              {
                field: 'mid_pectoralis_major-l',
                name: 'Mid Pectoralis Major L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'upper_pectoralis_major',
            name: 'Upper Pectoralis Major',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'upper_pectoralis_major-r',
                name: 'Upper Pectoralis Major R',
                type: AttributeType.Number,
              },
              {
                field: 'upper_pectoralis_major-l',
                name: 'Upper Pectoralis Major L',
                type: AttributeType.Number,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    field: 'teres_major',
    name: 'Teres Major',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'teres_major-r',
        name: 'Teres Major R',
        type: AttributeType.Number,
      },
      {
        field: 'teres_major-l',
        name: 'Teres Major L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'biceps_brachi',
    name: 'Biceps Brachi',
    type: AttributeType.Multiselect, // if nested put multiselect, leafes have number
    options: [
      {
        field: 'short_biceps_brachi',
        name: 'Short Biceps Brachi',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'short_biceps_brachi-r',
            name: 'Short Biceps Brachi R',
            type: AttributeType.Number,
          },
          {
            field: 'short_biceps_brachi-l',
            name: 'Short Biceps Brachi L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'long_biceps_brachi',
        name: 'Long Biceps Brachi',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'long_biceps_brachi-r',
            name: 'Long Biceps Brachi R',
            type: AttributeType.Number,
          },
          {
            field: 'long_biceps_brachi-l',
            name: 'Long Biceps Brachi L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'triceps_brachi',
    name: 'Triceps Brachi',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'triceps_brachi_medial_head',
        name: 'Triceps Brachi Medial Head',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'triceps_brachi_medial_head-r',
            name: 'Triceps Brachi Medial Head R',
            type: AttributeType.Number,
          },
          {
            field: 'triceps_brachi_medial_head-l',
            name: 'Triceps Brachi Medial Head L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'triceps_brachi_lateral_head',
        name: 'Triceps Brachi Lateral Head',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'triceps_brachi_lateral_head-r',
            name: 'Triceps Brachi Lateral Head R',
            type: AttributeType.Number,
          },
          {
            field: 'triceps_brachi_lateral_head-l',
            name: 'Triceps Brachi Lateral Head L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'core',
    name: 'Core',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'external_oblique',
        name: 'External Oblique',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'external_oblique-r',
            name: 'External Oblique R',
            type: AttributeType.Number,
          },
          {
            field: 'external_oblique-l',
            name: 'External Oblique L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'transversus_abdominis',
        name: 'Transversus Abdominis',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'transversus_abdominis-r',
            name: 'Transversus Abdominis R',
            type: AttributeType.Number,
          },
          {
            field: 'transversus_abdominis-l',
            name: 'Transversus Abdominis L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'rectus_abdominis',
        name: 'Rectus Abdominis',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'lower_rectus_abdominis',
            name: 'Lower Rectus Abdominis',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'lower_rectus_abdominis-r',
                name: 'Lower Rectus Abdominis R',
                type: AttributeType.Number,
              },
              {
                field: 'lower_rectus_abdominis-l',
                name: 'Lower Rectus Abdominis L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'upper_rectus_abdominis',
            name: 'Upper Rectus Abdominis',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'upper_rectus_abdominis-r',
                name: 'Upper Rectus Abdominis R',
                type: AttributeType.Number,
              },
              {
                field: 'upper_rectus_abdominis-l',
                name: 'Upper Rectus Abdominis L',
                type: AttributeType.Number,
              },
            ],
          },
        ],
      },
      {
        field: 'internal_oblique',
        name: 'Internal Oblique',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'internal_oblique-r',
            name: 'Internal Oblique R',
            type: AttributeType.Number,
          },
          {
            field: 'internal_oblique-l',
            name: 'Internal Oblique L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'lower_arm',
    name: 'Lower Arm',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'finger_flexors',
        name: 'Finger Flexors',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'finger_flexors-r',
            name: 'Finger Flexors R',
            type: AttributeType.Number,
          },
          {
            field: 'finger_flexors-l',
            name: 'Finger Flexors L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'wrist_flexors',
        name: 'Wrist Flexors',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'wrist_flexors-r',
            name: 'Wrist Flexors R',
            type: AttributeType.Number,
          },
          {
            field: 'wrist_flexors-l',
            name: 'Wrist Flexors L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'hand',
    name: 'Hand',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'hand-r',
        name: 'Hand R',
        type: AttributeType.Number,
      },
      {
        field: 'hand-l',
        name: 'Hand L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'iliopsoas',
    name: 'Iliopsoas',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'iliopsoas-r',
        name: 'Iliopsoas R',
        type: AttributeType.Number,
      },
      {
        field: 'iliopsoas-l',
        name: 'Iliopsoas L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'pectineus',
    name: 'Pectineus',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'pectineus-r',
        name: 'Pectineus R',
        type: AttributeType.Number,
      },
      {
        field: 'pectineus-l',
        name: 'Pectineus L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'hip_deep_muscles',
    name: 'Hip Deep Muscles',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'hip_deep_muscles-r',
        name: 'Hip Deep Muscles R',
        type: AttributeType.Number,
      },
      {
        field: 'hip_deep_muscles-l',
        name: 'Hip Deep Muscles L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'adductors',
    name: 'Adductors',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'adductor_brevis',
        name: 'Adductor Brevis',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'adductor_brevis-r',
            name: 'Adductor Brevis R',
            type: AttributeType.Number,
          },
          {
            field: 'adductor_brevis-l',
            name: 'Adductor Brevis L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'adductor_longus',
        name: 'Adductor Longus',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'adductor_longus-r',
            name: 'Adductor Longus R',
            type: AttributeType.Number,
          },
          {
            field: 'adductor_longus-l',
            name: 'Adductor Longus L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'gracilis',
    name: 'Gracilis',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'gracilis-r',
        name: 'Gracilis R',
        type: AttributeType.Number,
      },
      {
        field: 'gracilis-l',
        name: 'Gracilis L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'thigh',
    name: 'Thigh',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'quadriceps',
        name: 'Quadriceps',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'rectus_femoris',
            name: 'Rectus Femoris',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'rectus_femoris-r',
                name: 'Rectus Femoris R',
                type: AttributeType.Number,
              },
              {
                field: 'rectus_femoris-l',
                name: 'Rectus Femoris L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'vastus_intermedius',
            name: 'Vastus Intermedius',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'vastus_intermedius-r',
                name: 'Vastus Intermedius R',
                type: AttributeType.Number,
              },
              {
                field: 'vastus_intermedius-l',
                name: 'Vastus Intermedius L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'vastus_lateralis',
            name: 'Vastus Lateralis',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'vastus_lateralis-r',
                name: 'Vastus Lateralis R',
                type: AttributeType.Number,
              },
              {
                field: 'vastus_lateralis-l',
                name: 'Vastus Lateralis L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'vastus_medialis',
            name: 'Vastus Medialis',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'vastus_medialis-r',
                name: 'Vastus Medialis R',
                type: AttributeType.Number,
              },
              {
                field: 'vastus_medialis-l',
                name: 'Vastus Medialis L',
                type: AttributeType.Number,
              },
            ],
          },
        ],
      },
      {
        field: 'sartorius',
        name: 'Sartorius',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'sartorius-r',
            name: 'Sartorius R',
            type: AttributeType.Number,
          },
          {
            field: 'sartorius-l',
            name: 'Sartorius L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'tfl',
        name: 'TFL',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'tfl-r',
            name: 'TFL R',
            type: AttributeType.Number,
          },
          {
            field: 'tfl-l',
            name: 'TFL L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'knee',
    name: 'Knee',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'knee-r',
        name: 'Knee R',
        type: AttributeType.Number,
      },
      {
        field: 'knee-l',
        name: 'Knee L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'anterior_shin',
    name: 'Anterior Shin',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'tibialis_anterior-r',
        name: 'Tibialis Anterior R',
        type: AttributeType.Number,
      },
      {
        field: 'tibialis_anterior-l',
        name: 'Tibialis Anterior L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'gastrocnemius',
    name: 'Gastrocnemius',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'gastrocnemius-r',
        name: 'Gastrocnemius R',
        type: AttributeType.Number,
      },
      {
        field: 'gastrocnemius-l',
        name: 'Gastrocnemius L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'foot',
    name: 'Foot',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'foot-r',
        name: 'Foot R',
        type: AttributeType.Number,
      },
      {
        field: 'foot-l',
        name: 'Foot L',
        type: AttributeType.Number,
      },
    ],
  },
];

export const MUSCLES_BACK: Attribute[] = [
  {
    field: 'head',
    name: 'Head',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'head-r',
        name: 'Head R',
        type: AttributeType.Number,
      },
      {
        field: 'head-l',
        name: 'Head L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'trapezius_back',
    name: 'Trapezius Back',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'upper_trapezius',
        name: 'Upper Trapezius',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'upper_trapezius-r',
            name: 'Upper Trapezius R',
            type: AttributeType.Number,
          },
          {
            field: 'upper_trapezius-l',
            name: 'Upper Trapezius L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'middle_trapezius',
        name: 'Middle Trapezius',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'middle_trapezius-r',
            name: 'Middle Trapezius R',
            type: AttributeType.Number,
          },
          {
            field: 'middle_trapezius-l',
            name: 'Middle Trapezius L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'lower_trapezius',
        name: 'Lower Trapezius',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'lower_trapezius-r',
            name: 'Lower Trapezius R',
            type: AttributeType.Number,
          },
          {
            field: 'lower_trapezius-l',
            name: 'Lower Trapezius L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'sternocleidomastoid',
    name: 'Sternocleidomastoid',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'sternocleidomastoid-r',
        name: 'Sternocleidomastoid R',
        type: AttributeType.Number,
      },
      {
        field: 'sternocleidomastoid-l',
        name: 'Sternocleidomastoid L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'erector_spinae',
    name: 'Erector Spinae',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'erector_spinae_cervical',
        name: 'Erector Spinae Cervical',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'erector_spinae_cervical',
            name: 'Erector Spinae Cervical',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'erector_spinae_thoracis',
        name: 'Erector Spinae Thoracis',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'erector_spinae_thoracis',
            name: 'Erector Spinae Thoracis',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'erector_spinae_lumbar',
        name: 'Erector Spinae Lumbar',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'erector_spinae_lumbar',
            name: 'Erector Spinae Lumbar',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'rhomboid',
    name: 'Rhomboid',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'rhomboid_minor',
        name: 'Rhomboid Minor',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'rhomboid_minor-r',
            name: 'Rhomboid Minor R',
            type: AttributeType.Number,
          },
          {
            field: 'rhomboid_minor-l',
            name: 'Rhomboid Minor L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'rhomboid_major',
        name: 'Rhomboid Major',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'rhomboid_major-r',
            name: 'Rhomboid Major R',
            type: AttributeType.Number,
          },
          {
            field: 'rhomboid_major-l',
            name: 'Rhomboid Major L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'acromion',
    name: 'Acromion',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'acromion-r',
        name: 'Acromion R',
        type: AttributeType.Number,
      },
      {
        field: 'acromion-l',
        name: 'Acromion L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'deltoid_back',
    name: 'Deltoid Back',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'deltoid_lateral_back',
        name: 'Deltoid Lateral Back',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'deltoid_lateral_back-r',
            name: 'Deltoid Lateral Back R',
            type: AttributeType.Number,
          },
          {
            field: 'deltoid_lateral_back-l',
            name: 'Deltoid Lateral Back L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'deltoid_posterior',
        name: 'Deltoid Posterior',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'deltoid_posterior-r',
            name: 'Deltoid Posterior R',
            type: AttributeType.Number,
          },
          {
            field: 'deltoid_posterior-l',
            name: 'Deltoid Posterior L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'spinatus',
    name: 'Spinatus',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'supraspinatus',
        name: 'Supraspinatus',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'supraspinatus-r',
            name: 'Supraspinatus R',
            type: AttributeType.Number,
          },
          {
            field: 'supraspinatus-l',
            name: 'Supraspinatus L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'infraspinatus',
        name: 'Infraspinatus',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'infraspinatus-r',
            name: 'Infraspinatus R',
            type: AttributeType.Number,
          },
          {
            field: 'infraspinatus-l',
            name: 'Infraspinatus L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'triceps_brachi',
    name: 'Triceps Brachii',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'triceps_brachi_long_head',
        name: 'Triceps Brachii Long Head',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'triceps_brachi_long_head-r',
            name: 'Triceps Brachii Long Head R',
            type: AttributeType.Number,
          },
          {
            field: 'triceps_brachi_long_head-l',
            name: 'Triceps Brachii Long Head L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'triceps_brachi_medial_head',
        name: 'Triceps Brachii Medial Head',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'triceps_brachi_medial_head-r',
            name: 'Triceps Brachii Medial Head R',
            type: AttributeType.Number,
          },
          {
            field: 'triceps_brachi_medial_head-l',
            name: 'Triceps Brachii Medial Head L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'triceps_brachi_lateral_head',
        name: 'Triceps Brachii Lateral Head',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'triceps_brachi_lateral_head-r',
            name: 'Triceps Brachii Lateral Head R',
            type: AttributeType.Number,
          },
          {
            field: 'triceps_brachi_lateral_head-l',
            name: 'Triceps Brachii Lateral Head L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'teres_mami',
    name: 'Teres Mami',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'teres_mami-r',
        name: 'Teres Mami R',
        type: AttributeType.Number,
      },
      {
        field: 'teres_mami-l',
        name: 'Teres Mami L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'latisimus_dorsi',
    name: 'Latissimus Dorsi',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'latisimus_dorsi-r',
        name: 'Latissimus Dorsi R',
        type: AttributeType.Number,
      },
      {
        field: 'latisimus_dorsi-l',
        name: 'Latissimus Dorsi L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'serratus_posterior',
    name: 'Serratus Posterior',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'serratus_posterior',
        name: 'Serratus Posterior',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'lower_arm',
    name: 'Lower Arm',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'elbow',
        name: 'Elbow',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'elbow_upper',
            name: 'Elbow Upper',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'elbow_upper-r',
                name: 'Elbow Upper R',
                type: AttributeType.Number,
              },
              {
                field: 'elbow_upper-l',
                name: 'Elbow Upper L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'elbow_middle_1',
            name: 'Elbow Middle 1',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'elbow_middle_1-r',
                name: 'Elbow Middle 1 R',
                type: AttributeType.Number,
              },
              {
                field: 'elbow_middle_1-l',
                name: 'Elbow Middle 1 L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'elbow_middle_2',
            name: 'Elbow Middle 2',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'elbow_middle_2-r',
                name: 'Elbow Middle 2 R',
                type: AttributeType.Number,
              },
              {
                field: 'elbow_middle_2-l',
                name: 'Elbow Middle 2 L',
                type: AttributeType.Number,
              },
            ],
          },
          {
            field: 'elbow_lower',
            name: 'Elbow Lower',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'elbow_lower-r',
                name: 'Elbow Lower R',
                type: AttributeType.Number,
              },
              {
                field: 'elbow_lower-l',
                name: 'Elbow Lower L',
                type: AttributeType.Number,
              },
            ],
          },
        ],
      },
      {
        field: 'wrist_extensors',
        name: 'Wrist Extensors',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'wrist_extensors-r',
            name: 'Wrist Extensors R',
            type: AttributeType.Number,
          },
          {
            field: 'wrist_extensors-l',
            name: 'Wrist Extensors L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'finger_extensors',
        name: 'Finger Extensors',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'finger_extensors-r',
            name: 'Finger Extensors R',
            type: AttributeType.Number,
          },
          {
            field: 'finger_extensors-l',
            name: 'Finger Extensors L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'quadratus_lumborum',
    name: 'Quadratus Lumborum',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'quadratus_lumborum-r',
        name: 'Quadratus Lumborum R',
        type: AttributeType.Number,
      },
      {
        field: 'quadratus_lumborum-l',
        name: 'Quadratus Lumborum L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'core',
    name: 'Core',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'internal_oblique',
        name: 'Internal Oblique',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'internal_oblique-r',
            name: 'Internal Oblique R',
            type: AttributeType.Number,
          },
          {
            field: 'internal_oblique-l',
            name: 'Internal Oblique L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'external_oblique',
        name: 'External Oblique',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'external_oblique-r',
            name: 'External Oblique R',
            type: AttributeType.Number,
          },
          {
            field: 'external_oblique-l',
            name: 'External Oblique L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'gluteus',
    name: 'Gluteus Maximus',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'gluteus_maximus',
        name: 'Gluteus Maximus',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'gluteus_maximus-r',
            name: 'Gluteus Maximus R',
            type: AttributeType.Number,
          },
          {
            field: 'gluteus_maximus-l',
            name: 'Gluteus Maximus L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'gluteus_minimus',
        name: 'Gluteus Minimus',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'gluteus_minimus-r',
            name: 'Gluteus Minimus R',
            type: AttributeType.Number,
          },
          {
            field: 'gluteus_minimus-l',
            name: 'Gluteus Minimus L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'gluteus_medius',
        name: 'Gluteus Medius',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'gluteus_medius-r',
            name: 'Gluteus Medius R',
            type: AttributeType.Number,
          },
          {
            field: 'gluteus_medius-l',
            name: 'Gluteus Medius L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'hand',
    name: 'Hand',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'hand-r',
        name: 'Hand R',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'thumb-r',
            name: 'Thumb R',
            type: AttributeType.Number,
          },
          {
            field: 'middle_finger-r',
            name: 'Middle Finger R',
            type: AttributeType.Number,
          },
          {
            field: 'ring_finger-r',
            name: 'Ring Finger R',
            type: AttributeType.Number,
          },
          {
            field: 'pinky-r',
            name: 'Pinky R',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'hand-l',
        name: 'Hand L',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'thumb-l',
            name: 'Thumb L',
            type: AttributeType.Number,
          },
          {
            field: 'middle_finger-l',
            name: 'Middle Finger L',
            type: AttributeType.Number,
          },
          {
            field: 'ring_finger-l',
            name: 'Ring Finger L',
            type: AttributeType.Number,
          },
          {
            field: 'pinky-l',
            name: 'Pinky L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'tfl',
    name: 'TFL',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'tfl-r',
        name: 'TFL R',
        type: AttributeType.Number,
      },
      {
        field: 'tfl-l',
        name: 'TFL L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'adductor_magnus',
    name: 'Adductor Magnus',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'adductor_magnus-r',
        name: 'Adductor Magnus R',
        type: AttributeType.Number,
      },
      {
        field: 'adductor_magnus-l',
        name: 'Adductor Magnus L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'semitendinosus',
    name: 'Semitendinosus',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'semitendinosus-r',
        name: 'Semitendinosus R',
        type: AttributeType.Number,
      },
      {
        field: 'semitendinosus-l',
        name: 'Semitendinosus L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'biceps_femoris',
    name: 'Biceps Femoris',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'biceps_femoris_long_head',
        name: 'Biceps Femoris Long Head',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'biceps_femoris_long_head-r',
            name: 'Biceps Femoris Long Head R',
            type: AttributeType.Number,
          },
          {
            field: 'biceps_femoris_long_head-l',
            name: 'Biceps Femoris Long Head L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'biceps_femoris_short_head',
        name: 'Biceps Femoris Short Head',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'biceps_femoris_short_head-r',
            name: 'Biceps Femoris Short Head R',
            type: AttributeType.Number,
          },
          {
            field: 'biceps_femoris_short_head-l',
            name: 'Biceps Femoris Short Head L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
  {
    field: 'semimembranosus',
    name: 'Semimembranosus',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'semimembranosus-r',
        name: 'Semimembranosus R',
        type: AttributeType.Number,
      },
      {
        field: 'semimembranosus-l',
        name: 'Semimembranosus L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'gracilis',
    name: 'Gracilis',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'gracilis-r',
        name: 'Gracilis R',
        type: AttributeType.Number,
      },
      {
        field: 'gracilis-l',
        name: 'Gracilis L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'gastrocnemius',
    name: 'Gastrocnemius',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'gastrocnemius-r',
        name: 'Gastrocnemius R',
        type: AttributeType.Number,
      },
      {
        field: 'gastrocnemius-l',
        name: 'Gastrocnemius L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'soleus',
    name: 'Soleus',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'soleus-r',
        name: 'Soleus R',
        type: AttributeType.Number,
      },
      {
        field: 'soleus-l',
        name: 'Soleus L',
        type: AttributeType.Number,
      },
    ],
  },
  {
    field: 'foot',
    name: 'Foot',
    type: AttributeType.Multiselect,
    options: [
      {
        field: 'foot-r',
        name: 'Foot R',
        type: AttributeType.Number,
      },
      {
        field: 'foot-l',
        name: 'Foot L',
        type: AttributeType.Number,
      },
    ],
  },
] as const;
