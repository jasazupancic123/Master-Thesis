export enum FirestoreCollection {
  // root hierarchy
  USER = 'users',
  COMPONENT = 'components',
  EXERCISE_ATTRIBUTE = 'attributes',

  // exercise hierarchy
  EXERCISE = 'exercises',
  EXERCISE_ATTRIBUTE_VALUE = 'values',

  // user hierarchy
  WELLNESS = 'wellness',
  GROUP = 'groups',
  SUBGROUP = 'subgroups',
  CYCLE = 'cycles',
  TRAINING = 'trainings',
  TRAINING_COMPONENT = 'training-components',
  TRAINING_EXERCISE = 'training-exercises',
  TRAINING_EXERCISE_USER_DATA = 'user-data',
}