export enum FirestoreCollection {
  // local development
  LOCAL_DEV = 'local-dev',

  // root hierarchy
  USER = 'users',
  COMPONENT = 'components',
  EXERCISE_ATTRIBUTE = 'attributes',

  // exercise hierarchy
  EXERCISE = 'exercises',

  // user hierarchy
  WELLNESS = 'wellness',
  GROUP = 'groups',
  SUBGROUP = 'subgroups',
  CYCLE = 'cycles',
  TRAINING = 'trainings',
  TRAINING_COMPONENT = 'training-components',
  TRAINING_SUPERSET = 'training-supersets',
  TRAINING_EXERCISE = 'training-exercises',
  TRAINING_EXERCISE_USER_DATA = 'user-data',
}
