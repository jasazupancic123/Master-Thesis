import { Attribute } from '@/core/attribute/type/attribute.type';

export const musclesTree: Attribute[] = [
  {
    field: 'Upper',
    name: 'Upper',
    options: [
      {
        field: 'Neck/Upper Back',
        name: 'Neck/Upper Back',
        options: [
          {
            field: 'Trapezii',
            name: 'Trapezii',
            options: [
              {
                field: 'trapezius-r',
                name: 'Right Trapezius',
              },
              {
                field: 'trapezius-l',
                name: 'Left Trapezius',
              },
            ],
          },
        ],
      },
      {
        field: 'Neck',
        name: 'Neck',
        options: [
          {
            field: 'Scalenes',
            name: 'Scalenes',
            options: [
              {
                field: 'scalenes-r',
                name: 'Right Scalenes',
              },
              {
                field: 'scalenes-l',
                name: 'Left Scalenes',
              },
            ],
          },
          {
            field: 'Sternocleidomastoid',
            name: 'Sternocleidomastoid',
            options: [
              {
                field: 'sternocleidomastoid-r',
                name: 'Right Sternocleidomastoid',
              },
              {
                field: 'sternocleidomastoid-l',
                name: 'Left Sternocleidomastoid',
              },
            ],
          },
          {
            field: 'Longus Colli',
            name: 'Longus Colli',
            options: [
              {
                field: 'longus_colli_longus_capitis-l',
                name: 'Left Longus Colli Longus Capitis',
              },
              {
                field: 'longus_colli_longus_capitis-r',
                name: 'Right Longus Colli Longus Capitis',
              },
            ],
          },
        ],
      },
      {
        field: 'Chest',
        name: 'Chest',
        options: [
          {
            field: 'Pectoralis',
            name: 'Pectoralis',
            options: [
              {
                field: 'pectoralis_minor-r',
                name: 'Right Pectoralis Minor',
              },
              {
                field: 'pectoralis_minor-l',
                name: 'Left Pectoralis Minor',
              },
              {
                field: 'mid_pectoralis_major-r',
                name: 'Right Mid Pectoralis Major',
              },
              {
                field: 'mid_pectoralis_major-l',
                name: 'Left Mid Pectoralis Major',
              },
              {
                field: 'lower_pectoralis_major-l',
                name: 'Left Lower Pectoralis Major',
              },
              {
                field: 'lower_pectoralis_major-r',
                name: 'Right Lower Pectoralis Major',
              },
            ],
          },
          {
            field: 'Serratus',
            name: 'Serratus',
            options: [
              {
                field: 'seratus_anterior-r',
                name: 'Right Seratus Anterior',
              },
              {
                field: 'seratus_anterior-l',
                name: 'Left Seratus Anterior',
              },
            ],
          },
        ],
      },
      {
        field: 'Core',
        name: 'Core',
        options: [
          {
            field: 'Abdominals',
            name: 'Abdominals',
            options: [
              {
                field: 'external_oblique-l',
                name: 'Left External Oblique',
              },
              {
                field: 'external_oblique-r',
                name: 'Right External Oblique',
              },
              {
                field: 'internal_oblique-r',
                name: 'Right Internal Oblique',
              },
              {
                field: 'internal_oblique-l',
                name: 'Left Internal Oblique',
              },
              {
                field: 'transversus_abdominis-r',
                name: 'Right Transversus Abdominis',
              },
              {
                field: 'transversus_abdominis-l',
                name: 'Left Transversus Abdominis',
              },
              {
                field: 'upper_rectus_abdominis-r',
                name: 'Right Upper Rectus Abdominis',
              },
              {
                field: 'upper_rectus_abdominis-l',
                name: 'Left Upper Rectus Abdominis',
              },
              {
                field: 'lower_rectus_abdominis-r',
                name: 'Right Lower Rectus Abdominis',
              },
              {
                field: 'lower_rectus_abdominis-l',
                name: 'Left Lower Rectus Abdominis',
              },
              {
                field: 'internal_oblique-r',
                name: 'Right Internal Oblique',
              },
              {
                field: 'internal_oblique-l',
                name: 'Left Internal Oblique',
              },
              {
                field: 'extrenal_oblique-r',
                name: 'Right Extrenal Oblique',
              },
              {
                field: 'extrenal_oblique-l',
                name: 'Left Extrenal Oblique',
              },
            ],
          },
        ],
      },
      {
        field: 'Shoulder',
        name: 'Shoulder',
        options: [
          {
            field: 'Scapulohumerals',
            name: 'Scapulohumerals',
            options: [
              {
                field: 'teres_major-r',
                name: 'Right Teres Major',
              },
              {
                field: 'teres_major-l',
                name: 'Left Teres Major',
              },
            ],
          },
          {
            field: 'Deltoids',
            name: 'Deltoids',
            options: [
              {
                field: 'deltoid_anterior-r',
                name: 'Right Deltoid Anterior',
              },
              {
                field: 'deltoid_anterior-l',
                name: 'Left Deltoid Anterior',
              },
              {
                field: 'deltoid_posterior-r',
                name: 'Right Deltoid Posterior',
              },
              {
                field: 'deltoid_posterior-l',
                name: 'Left Deltoid Posterior',
              },
              {
                field: 'deltoid_lateral-r',
                name: 'Right Deltoid Lateral',
              },
              {
                field: 'deltoid_lateral-l',
                name: 'Left Deltoid Lateral',
              },
            ],
          },
          {
            field: 'Rotator Cuff',
            name: 'Rotator Cuff',
            options: [
              {
                field: 'supraspinatus-r',
                name: 'Right Supraspinatus',
              },
              {
                field: 'supraspinatus-l',
                name: 'Left Supraspinatus',
              },
              {
                field: 'infraspinatus-r',
                name: 'Right Infraspinatus',
              },
              {
                field: 'infraspinatus-l',
                name: 'Left Infraspinatus',
              },
              {
                field: 'teres_mami_r',
                name: 'Teres Mami R',
              },
              {
                field: 'teres_mami-l',
                name: 'Left Teres Mami',
              },
            ],
          },
        ],
      },
      {
        field: 'Arm',
        name: 'Arm',
        options: [
          {
            field: 'Upper Arm',
            name: 'Upper Arm',
            options: [
              {
                field: 'short_biceps_brachi-r',
                name: 'Right Short Biceps Brachi',
              },
              {
                field: 'short_biceps_brachi-l',
                name: 'Left Short Biceps Brachi',
              },
              {
                field: 'long_biceps_brachi-r',
                name: 'Right Long Biceps Brachi',
              },
              {
                field: 'long_biceps_brachi-l',
                name: 'Left Long Biceps Brachi',
              },
              {
                field: 'triceps_brachi_lateral_head-r',
                name: 'Right Triceps Brachi Lateral Head',
              },
              {
                field: 'triceps_brachi_lateral_head-l',
                name: 'Left Triceps Brachi Lateral Head',
              },
              {
                field: 'triceps_brachi_medial_head-r',
                name: 'Right Triceps Brachi Medial Head',
              },
              {
                field: 'triceps_brachi_medial_head-l',
                name: 'Left Triceps Brachi Medial Head',
              },
              {
                field: 'triceps_brachi_long_head-l',
                name: 'Left Triceps Brachi Long Head',
              },
              {
                field: 'triceps_brachi_long_head-r',
                name: 'Right Triceps Brachi Long Head',
              },
            ],
          },
          {
            field: 'Forearm',
            name: 'Forearm',
            options: [
              {
                field: 'finger_flexors-r',
                name: 'Right Finger Flexors',
              },
              {
                field: 'finger_flexors-l',
                name: 'Left Finger Flexors',
              },
              {
                field: 'wrist_flexors-r',
                name: 'Right Wrist Flexors',
              },
              {
                field: 'wrist_flexors-l',
                name: 'Left Wrist Flexors',
              },
              {
                field: 'wrist_extensors-r',
                name: 'Right Wrist Extensors',
              },
              {
                field: 'wrist_extensors-l',
                name: 'Left Wrist Extensors',
              },
              {
                field: 'finger_extensors-r',
                name: 'Right Finger Extensors',
              },
              {
                field: 'finger_extensors-l',
                name: 'Left Finger Extensors',
              },
            ],
          },
        ],
      },
      {
        field: 'Upper Back',
        name: 'Upper Back',
        options: [
          {
            field: 'Paraspinal Muscles',
            name: 'Paraspinal Muscles',
            options: [
              {
                field: 'erector_spinae_cervical',
                name: 'Erector Spinae Cervical',
              },
            ],
          },
          {
            field: 'Trapezii',
            name: 'Trapezii',
            options: [
              {
                field: 'upper_trapezius-l',
                name: 'Left Upper Trapezius',
              },
              {
                field: 'upper_trapezius-r',
                name: 'Right Upper Trapezius',
              },
              {
                field: 'middle_trapezius-l',
                name: 'Left Middle Trapezius',
              },
              {
                field: 'middle_trapezius-r',
                name: 'Right Middle Trapezius',
              },
              {
                field: 'lower_trapazius-l',
                name: 'Left Lower Trapazius',
              },
              {
                field: 'lower_trapazius-r',
                name: 'Right Lower Trapazius',
              },
            ],
          },
          {
            field: 'Rhomboids',
            name: 'Rhomboids',
            options: [
              {
                field: 'rhomboid_minor-l',
                name: 'Left Rhomboid Minor',
              },
              {
                field: 'rhomboid_minor-r',
                name: 'Right Rhomboid Minor',
              },
              {
                field: 'rhomboid_major-r',
                name: 'Right Rhomboid Major',
              },
              {
                field: 'rhomboid_major-l',
                name: 'Left Rhomboid Major',
              },
            ],
          },
          {
            field: 'nan',
            name: 'nan',
            options: [
              {
                field: 'serratus_posterior',
                name: 'Serratus Posterior',
              },
            ],
          },
        ],
      },
      {
        field: 'Lower Back',
        name: 'Lower Back',
        options: [
          {
            field: 'Paraspinal Muscles',
            name: 'Paraspinal Muscles',
            options: [
              {
                field: 'erector_spinae_lumbar',
                name: 'Erector Spinae Lumbar',
              },
              {
                field: 'erector_spinae-thoracis',
                name: 'Erector Spinae-Thoracis',
              },
              {
                field: 'quadratus_lumborum-l',
                name: 'Left Quadratus Lumborum',
              },
              {
                field: 'quadratus_lumborum-r',
                name: 'Right Quadratus Lumborum',
              },
            ],
          },
          {
            field: 'nan',
            name: 'nan',
            options: [
              {
                field: 'latisimus_dorsi-r',
                name: 'Right Latisimus Dorsi',
              },
              {
                field: 'latisimus_dorsi-l',
                name: 'Left Latisimus Dorsi',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    field: 'Lower',
    name: 'Lower',
    options: [
      {
        field: 'Thigh',
        name: 'Thigh',
        options: [
          {
            field: 'Quadriceps',
            name: 'Quadriceps',
            options: [
              {
                field: 'vastus_lateralis-r',
                name: 'Right Vastus Lateralis',
              },
              {
                field: 'vastus_lateralis-l',
                name: 'Left Vastus Lateralis',
              },
              {
                field: 'rectus_femoris-r',
                name: 'Right Rectus Femoris',
              },
              {
                field: 'rectus_femoris-l',
                name: 'Left Rectus Femoris',
              },
              {
                field: 'vastus_intermedius-r',
                name: 'Right Vastus Intermedius',
              },
              {
                field: 'vastus_intermedius-l',
                name: 'Left Vastus Intermedius',
              },
              {
                field: 'vastus_medialis-r',
                name: 'Right Vastus Medialis',
              },
              {
                field: 'vastus_medialis-l',
                name: 'Left Vastus Medialis',
              },
            ],
          },
          {
            field: 'Hip Flexors',
            name: 'Hip Flexors',
            options: [
              {
                field: 'sartorius-l',
                name: 'Left Sartorius',
              },
              {
                field: 'sartorius-r',
                name: 'Right Sartorius',
              },
              {
                field: 'iliopsoas-r',
                name: 'Right Iliopsoas',
              },
              {
                field: 'iliopsoas-l',
                name: 'Left Iliopsoas',
              },
            ],
          },
          {
            field: 'Hip Abductors',
            name: 'Hip Abductors',
            options: [
              {
                field: 'tfl-r',
                name: 'Right Tfl',
              },
              {
                field: 'tfl-l',
                name: 'Left Tfl',
              },
            ],
          },
          {
            field: 'Hip Adductors',
            name: 'Hip Adductors',
            options: [
              {
                field: 'pectineus-r',
                name: 'Right Pectineus',
              },
              {
                field: 'pectineus-l',
                name: 'Left Pectineus',
              },
              {
                field: 'adductor_brevis-r',
                name: 'Right Adductor Brevis',
              },
              {
                field: 'adductor_brevis-l',
                name: 'Left Adductor Brevis',
              },
              {
                field: 'adductor_longus-l',
                name: 'Left Adductor Longus',
              },
              {
                field: 'adductor_longus-r',
                name: 'Right Adductor Longus',
              },
              {
                field: 'gracilis-r',
                name: 'Right Gracilis',
              },
              {
                field: 'gracilis-l',
                name: 'Left Gracilis',
              },
              {
                field: 'adductor_magnus-r',
                name: 'Right Adductor Magnus',
              },
              {
                field: 'adductor_magnus-l',
                name: 'Left Adductor Magnus',
              },
            ],
          },
          {
            field: 'Hip Deep',
            name: 'Hip Deep',
            options: [
              {
                field: 'hip_deep_muscles-r',
                name: 'Right Hip Deep Muscles',
              },
              {
                field: 'hip_deep_muscles-l',
                name: 'Left Hip Deep Muscles',
              },
            ],
          },
          {
            field: 'Gluteals',
            name: 'Gluteals',
            options: [
              {
                field: 'gluteus_medius-r',
                name: 'Right Gluteus Medius',
              },
              {
                field: 'gluteus_medius-l',
                name: 'Left Gluteus Medius',
              },
              {
                field: 'gluteus_minimus-r',
                name: 'Right Gluteus Minimus',
              },
              {
                field: 'gluteus_minimus-l',
                name: 'Left Gluteus Minimus',
              },
              {
                field: 'gluteus_maximus-l',
                name: 'Left Gluteus Maximus',
              },
              {
                field: 'gluteus_maximus-r',
                name: 'Right Gluteus Maximus',
              },
            ],
          },
          {
            field: 'Hamstrings',
            name: 'Hamstrings',
            options: [
              {
                field: 'semimembranosus-r',
                name: 'Right Semimembranosus',
              },
              {
                field: 'semimembranosus-l',
                name: 'Left Semimembranosus',
              },
              {
                field: 'semitendinosus-r',
                name: 'Right Semitendinosus',
              },
              {
                field: 'semitendinosus-l',
                name: 'Left Semitendinosus',
              },
              {
                field: 'biceps_femoris_long_head-l',
                name: 'Left Biceps Femoris Long Head',
              },
              {
                field: 'biceps_femoris_long_head-r',
                name: 'Right Biceps Femoris Long Head',
              },
              {
                field: 'biceps_femoris_short_head-r',
                name: 'Right Biceps Femoris Short Head',
              },
              {
                field: 'biceps_femoris_short_head-l',
                name: 'Left Biceps Femoris Short Head',
              },
            ],
          },
        ],
      },
      {
        field: 'Lower Leg',
        name: 'Lower Leg',
        options: [
          {
            field: 'Tibia',
            name: 'Tibia',
            options: [
              {
                field: 'tibialis_anterior-r',
                name: 'Right Tibialis Anterior',
              },
              {
                field: 'tibialis_anterior-l',
                name: 'Left Tibialis Anterior',
              },
            ],
          },
          {
            field: 'Calf',
            name: 'Calf',
            options: [
              {
                field: 'gastrocnemius-r',
                name: 'Right Gastrocnemius',
              },
              {
                field: 'gastrocnemius-l',
                name: 'Left Gastrocnemius',
              },
              {
                field: 'soleus-r',
                name: 'Right Soleus',
              },
              {
                field: 'soleus-l',
                name: 'Left Soleus',
              },
            ],
          },
        ],
      },
    ],
  },
];
