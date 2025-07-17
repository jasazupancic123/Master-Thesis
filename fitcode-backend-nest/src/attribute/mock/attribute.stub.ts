import {
  generateRandomName,
  generateRandomString,
} from '@test/common/utils/random.util';

import { AttributeType } from '@src/common/enum/attribute-type.enum';

import type { Attribute } from '../entity/attribute.entity';

export function generateAttributeStub(data?: Partial<Attribute>): Attribute {
  return {
    field: data?.field || generateRandomString(),
    name: data?.name || generateRandomName(),
    options: data?.options,
    type: data?.type || AttributeType.String,
    required: data?.required || false,
    unit: data?.unit || '',
    defaultValue: data?.defaultValue,
  };
}

export function generateMultiselectAttribute(): Attribute {
  return generateAttributeStub({
    field: 'root',
    name: 'Root',
    required: true,
    type: AttributeType.Multiselect,
    options: [
      generateAttributeStub({
        field: 'first',
        name: 'Root First',
        type: AttributeType.Multiselect,
        options: [
          generateAttributeStub({
            field: 'a',
            name: 'Option A (value)',
            type: AttributeType.Value,
          }),
          generateAttributeStub({
            field: 'b',
            name: 'Option B (value)',
            type: AttributeType.Value,
          }),
          generateAttributeStub({
            field: 'c',
            name: 'Option C (string)',
            type: AttributeType.String,
          }),
        ],
      }),
      generateAttributeStub({
        field: 'second',
        name: 'Root Second',
        type: AttributeType.Multiselect,
        options: [
          generateAttributeStub({
            field: 'a',
            name: 'Option A (number)',
            type: AttributeType.Number,
          }),
          generateAttributeStub({
            field: 'b',
            name: 'Option B (bool)',
            type: AttributeType.Boolean,
          }),
        ],
      }),
    ],
  });

  return {
    field: 'a',
    name: 'Equipment',
    type: AttributeType.Multiselect,
    required: true,
    options: [
      {
        field: 'cardio',
        name: 'Cardio Equipment',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'cardio-treadmill',
            name: 'Treadmill',
            type: AttributeType.Value,
          },
          {
            field: 'cardio-elliptical-trainer',
            name: 'Elliptical Trainer',
            type: AttributeType.Value,
          },
          {
            field: 'cardio-stationary-bike',
            name: 'Stationary Bike (Upright / Recumbent)',
            type: AttributeType.Value,
          },
          {
            field: 'cardio-rowing-machine',
            name: 'Rowing Machine',
            type: AttributeType.Value,
          },
          {
            field: 'cardio-stair-climber-stepper',
            name: 'Stair Climber/Stepper',
            type: AttributeType.Value,
          },
          {
            field: 'cardio-spin-bike',
            name: 'Spin Bike',
            type: AttributeType.Value,
          },
          {
            field: 'cardio-air-bike',
            name: 'Air Bike',
            type: AttributeType.Value,
          },
          {
            field: 'cardio-arc-trainer',
            name: 'Arc Trainer',
            type: AttributeType.Value,
          },
        ],
      },
      {
        field: 'strength-training',
        name: 'Strength Training Equipment',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'barbells',
            name: 'Barbells',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'olympic-barbell',
                name: 'Olympic Barbell',
                type: AttributeType.Value,
              },
              {
                field: 'ez-curl-bar',
                name: 'EZ Curl Bar',
                type: AttributeType.Value,
              },
            ],
          },
          {
            field: 'dumbbells',
            name: 'Dumbbells',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'adjustable-dumbbells',
                name: 'Adjustable Dumbbells',
                type: AttributeType.Value,
              },
              {
                field: 'fixed-dumbbells',
                name: 'Fixed Dumbbells',
                type: AttributeType.Value,
              },
            ],
          },
          {
            field: 'kettlebells',
            name: 'Kettlebells',
            type: AttributeType.Value,
          },
          {
            field: 'weight-plates',
            name: 'Weight Plates',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'standard-weight-plates',
                name: 'Standard',
                type: AttributeType.Value,
              },
              {
                field: 'bumper-plates',
                name: 'Bumper Plates',
                type: AttributeType.Value,
              },
            ],
          },
          {
            field: 'bench',
            name: 'Bench',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'flat-bench',
                name: 'Flat Bench',
                type: AttributeType.Value,
              },
              {
                field: 'adjustable-incline-bench',
                name: 'Adjustable/Incline Bench',
                type: AttributeType.Value,
              },
              {
                field: 'decline-bench',
                name: 'Decline Bench',
                type: AttributeType.Value,
              },
            ],
          },
          {
            field: 'power-rack-squat-rack',
            name: 'Power Rack/Squat Rack',
            type: AttributeType.Value,
          },
          {
            field: 'smith-machine',
            name: 'Smith Machine',
            type: AttributeType.Value,
          },
          {
            field: 'cable-machine',
            name: 'Cable Machine',
            type: AttributeType.Value,
          },
          {
            field: 'functional-trainer',
            name: 'Functional Trainer',
            type: AttributeType.Value,
          },
          {
            field: 'lat-pulldown-machine',
            name: 'Lat Pulldown Machine',
            type: AttributeType.Value,
          },
          {
            field: 'cable-crossover-machine',
            name: 'Cable Crossover Machine',
            type: AttributeType.Value,
          },
          {
            field: 'leg-press-machine',
            name: 'Leg Press Machine',
            type: AttributeType.Value,
          },
          {
            field: 'hack-squat-machine',
            name: 'Hack Squat Machine',
            type: AttributeType.Value,
          },
          {
            field: 'leg-extension-leg-curl-machine',
            name: 'Leg Extension/Leg Curl Machine',
            type: AttributeType.Value,
          },
          {
            field: 'preacher-curl-bench',
            name: 'Preacher Curl Bench',
            type: AttributeType.Value,
          },
          {
            field: 'chest-press-machine',
            name: 'Chest Press Machine',
            type: AttributeType.Value,
          },
          {
            field: 'shoulder-press-machine',
            name: 'Shoulder Press Machine',
            type: AttributeType.Value,
          },
          {
            field: 'pec-deck-machine',
            name: 'Pec Deck Machine',
            type: AttributeType.Value,
          },
          {
            field: 'seated-row-machine',
            name: 'Seated Row Machine',
            type: AttributeType.Value,
          },
          {
            field: 'abdominal-crunch-machine',
            name: 'Abdominal Crunch Machine',
            type: AttributeType.Value,
          },
          {
            field: 'back-extension-bench',
            name: 'Back Extension Bench',
            type: AttributeType.Value,
          },
        ],
      },
      {
        field: 'free-weight-accessories',
        name: 'Free Weight Accessories',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'weightlifting-belt',
            name: 'Weightlifting Belt',
            type: AttributeType.Value,
          },
          {
            field: 'lifting-straps',
            name: 'Lifting Straps',
            type: AttributeType.Value,
          },
          {
            field: 'weightlifting-gloves',
            name: 'Weightlifting Gloves',
            type: AttributeType.Value,
          },
          {
            field: 'foam-roller',
            name: 'Foam Roller',
            type: AttributeType.Value,
          },
          {
            field: 'resistance-bands',
            name: 'Resistance Bands',
            type: AttributeType.Value,
          },
          {
            field: 'medicine-ball',
            name: 'Medicine Ball',
            type: AttributeType.Value,
          },
          {
            field: 'slam-ball',
            name: 'Slam Ball',
            type: AttributeType.Value,
          },
          {
            field: 'battle-ropes',
            name: 'Battle Ropes',
            type: AttributeType.Value,
          },
          {
            field: 'sandbags',
            name: 'Sandbags',
            type: AttributeType.Value,
          },
        ],
      },
      {
        field: 'bodyweight',
        name: 'Bodyweight Equipment',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'pull-up-bar',
            name: 'Pull-Up Bar',
            type: AttributeType.Value,
          },
          {
            field: 'dip-station',
            name: 'Dip Station',
            type: AttributeType.Value,
          },
          {
            field: 'gymnastic-rings',
            name: 'Gymnastic Rings',
            type: AttributeType.Value,
          },
          {
            field: 'parallettes',
            name: 'Parallettes',
            type: AttributeType.Value,
          },
          {
            field: 'push-up-bars',
            name: 'Push-Up Bars',
            type: AttributeType.Value,
          },
          {
            field: 'ab-wheel',
            name: 'Ab Wheel',
            type: AttributeType.Value,
          },
        ],
      },
      {
        field: 'functional',
        name: 'Functional Training Equipment',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'trx-suspension-trainer',
            name: 'TRX Suspension Trainer',
            type: AttributeType.Value,
          },
          {
            field: 'plyo-box',
            name: 'Plyo Box (Plyometric Box)',
            type: AttributeType.Value,
          },
          {
            field: 'jump-rope',
            name: 'Jump Rope',
            type: AttributeType.Value,
          },
          {
            field: 'agility-ladder',
            name: 'Agility Ladder',
            type: AttributeType.Value,
          },
          {
            field: 'bosu-ball',
            name: 'BOSU Ball',
            type: AttributeType.Value,
          },
          {
            field: 'stability-ball',
            name: 'Stability Ball',
            type: AttributeType.Value,
          },
          {
            field: 'balance-board',
            name: 'Balance Board',
            type: AttributeType.Value,
          },
        ],
      },
      {
        field: 'specialty',
        name: 'Specialty Machines',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'smith-machine',
            name: 'Smith Machine',
            type: AttributeType.Value,
          },
          {
            field: 'glute-ham-developer',
            name: 'Glute Ham Developer (GHD)',
            type: AttributeType.Value,
          },
          {
            field: 't-bar-row-machine',
            name: 'T-Bar Row Machine',
            type: AttributeType.Value,
          },
          {
            field: 'chest-fly-machine',
            name: 'Chest Fly Machine',
            type: AttributeType.Value,
          },
          {
            field: 'seated-calf-raise-machine',
            name: 'Seated Calf Raise Machine',
            type: AttributeType.Value,
          },
          {
            field: 'vertical-knee-raise-dip-station',
            name: 'Vertical Knee Raise/Dip Station',
            type: AttributeType.Value,
          },
        ],
      },
      {
        field: 'miscellaneous',
        name: 'Miscellaneous Equipment',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'gym-timer-clock',
            name: 'Gym Timer/Clock',
            type: AttributeType.Value,
          },
          {
            field: 'sound-system',
            name: 'Sound System',
            type: AttributeType.Value,
          },
          {
            field: 'flooring-mats',
            name: 'Flooring Mats',
            type: AttributeType.Value,
          },
          {
            field: 'water-fountain-cooler',
            name: 'Water Fountain/Cooler',
            type: AttributeType.Value,
          },
          {
            field: 'towel-rack',
            name: 'Towel Rack',
            type: AttributeType.Value,
          },
          {
            field: 'mirrors',
            name: 'Mirrors',
            type: AttributeType.Value,
          },
        ],
      },
      {
        field: 'football',
        name: 'Football Equipment',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'balls',
            name: 'Balls',
            type: AttributeType.Value,
          },
          {
            field: 'marks',
            name: 'Marks',
            type: AttributeType.Value,
          },
          {
            field: 'bibs',
            name: 'Bibs',
            type: AttributeType.Value,
          },
          {
            field: 'sticks',
            name: 'Sticks',
            type: AttributeType.Value,
          },
          {
            field: 'mannequins',
            name: 'Mannequins',
            type: AttributeType.Value,
          },
        ],
      },
    ],
  };
}
