import type { Attribute } from '@/controller/attribute/type/attribute.type';

export const Category: Attribute[] = [
  { field: 'competition', name: 'Competition' },
  {
    field: 'strength',
    name: 'Strength',
    options: [
      { field: 'other', name: 'Other' },
      {
        field: 'power',
        name: 'Power',
        options: [
          { field: 'olympic-lifts', name: 'Olympic Lifts' },
          { field: 'fast-general', name: 'Fast General' },
          { field: 'jumping', name: 'Jumping' },
          { field: 'throwing', name: 'Throwing' },
          { field: 'running-based', name: 'Running Based' },
          { field: 'reactive', name: 'Reactive' },
          { field: 'explosive', name: 'Explosive' },
          { field: 'braking', name: 'Braking' },
        ],
      },
      {
        field: 'general',
        name: 'General Strength',
        options: [
          { field: 'concentric', name: 'Concentric' },
          { field: 'eccentric', name: 'Eccentric' },
          { field: 'isometric', name: 'Isometric' },
          { field: 'con-ecc', name: 'Con-Ecc' },
        ],
      },
      {
        field: 'corrective',
        name: 'Corrective',
        options: [
          { field: 'spine', name: 'Spine' },
          { field: 'hip', name: 'Hip' },
          { field: 'shoulder', name: 'Shoulder' },
          { field: 'ankle', name: 'Ankle' },
          { field: 'knee', name: 'Knee' },
        ],
      },
    ],
  },
  {
    field: 'speed',
    name: 'Speed',
    options: [
      { field: 'acceleration', name: 'Acceleration' },
      { name: 'Deceleration', field: 'deceleration' },
      { name: 'Peak Speed', field: 'peak-speed' },
      { name: 'COD', field: 'cod' },
      { name: 'Agility', field: 'agility' },
    ],
  },
  {
    name: 'Endurance',
    field: 'endurance',
    options: [
      { name: 'Aerobic Capacity', field: 'aerobic-capacity' },
      { name: 'Aerobic Power', field: 'aerobic-power' },
      { name: 'Anaerobic Capacity', field: 'anaerobic-capacity' },
      { name: 'Anaerobic Power', field: 'anaerobic-power' },
    ],
  },
  {
    name: 'Coordination',
    field: 'coordination',
    options: [
      { name: 'Technical Work', field: 'technical-work' },
      { name: 'Running Mechanics', field: 'running-mechanics' },
      { name: 'Jumping / Landing', field: 'jumping-landing' },
      { name: 'Orientation', field: 'orientation' },
      { name: 'Dissociation', field: 'dissociation' },
      { name: 'Balance', field: 'balance' },
      { name: 'Foot Alignment', field: 'foot-alignment' },
      { name: 'Reaction', field: 'reaction' },
      { name: 'Breathing', field: 'breathing' },
    ],
  },
  {
    name: 'ROM',
    field: 'rom',
    options: [
      {
        name: 'Flexibility',
        field: 'flexibility',
        options: [
          { field: 'ballistic', name: 'Ballistic Stretching' },
          { field: 'dynamic', name: 'Dynamic Stretching' },
          { field: 'active', name: 'Active Stretching' },
          { field: 'passive', name: 'Passive Stretching' },
          { field: 'static', name: 'Static Stretching' },
          { field: 'isometric', name: 'Isometric Stretching' },
          { field: 'pnf', name: 'PNF Stretching' },
        ],
      },
      {
        name: 'Mobility',
        field: 'mobility',
        options: [
          { field: 'dynamic-wu', name: 'Dynamic WU' },
          { field: 'wod', name: 'WOD' },
          { field: 'use-of-load', name: 'Use Of Load' },
          { field: 'exercise-rom', name: 'Exercise ROM' },
        ],
      },
    ],
  },
];
