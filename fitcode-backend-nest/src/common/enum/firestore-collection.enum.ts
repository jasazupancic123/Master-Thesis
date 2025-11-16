export enum FirestoreCollection {
  // system
  MIGRATION = 'migrations',
  LOCAL_DEV = 'local-dev',

  // root
  EXERCISE = 'exercises',
  INSTITUTION = 'institutions',
  INSTITUTION_MEMBERS = 'institution-members',
  GROUP = 'groups',
  PROFILE = 'profile',
  WELLNESS = 'wellness',

  // training
  TRAINING = 'trainings',
  TRAINING_WORKLOAD = 'training-workload',
  TRAINING_COMPONENT_USER_STATUS = 'training-component-user-status',

  // ai
  EXERCISE_AI_PRESCRIPTIONS = 'exercise-ai-prescriptions',
}
