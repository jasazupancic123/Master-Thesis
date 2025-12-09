export enum FirestoreCollection {
  // system
  MIGRATION = 'migrations',
  META = 'meta',

  // root
  EXERCISE = 'exercises',
  INSTITUTION = 'institutions',
  INSTITUTION_MEMBERS = 'institution-members',
  GROUP = 'groups',

  // user-related
  USER = 'profile',
  WELLNESS = 'wellness',
  USER_EXERCISE_STATS = 'user-exercise-stats',

  // training
  TRAINING = 'trainings',
  TRAINING_PROTOCOLS = 'protocols',
  TRAINING_WORKLOAD = 'training-workload',
  TRAINING_COMPONENT_USER_STATUS = 'training-component-user-status',

  // ai
  EXERCISE_AI_PRESCRIPTIONS = 'exercise-ai-prescriptions',
}
