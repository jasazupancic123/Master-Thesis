export enum FirestoreCollection {
  // local development
  LOCAL_DEV = 'local-dev',

  // root hierarchy
  USER = 'users',
  COMPONENT = 'components',

  // attributes
  ATTRIBUTE = 'attributes',
  PARAM = 'params',

  // exercise hierarchy
  EXERCISE = 'exercises',
  EXERCISE_ATTRIBUTE_VALUES = 'exerciseAttributeValues',

  // user hierarchy
  USER_META = 'user-meta',
  GROUP = 'groups',
  SUBGROUP = 'subgroups',
  TRAINING = 'trainings',
  INSTITUTION = 'institutions',
  METHOD = 'methods',
  TRAINING_WORKLOAD = 'training-workload',
  TRAINING_STATUS = 'training-status',
}
