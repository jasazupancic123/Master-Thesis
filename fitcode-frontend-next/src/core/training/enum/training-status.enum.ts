export enum TrainingStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1, // redirects user to active training
  COMPLETED = 2,
  PAUSED = 3, // active training but no redirect
}
