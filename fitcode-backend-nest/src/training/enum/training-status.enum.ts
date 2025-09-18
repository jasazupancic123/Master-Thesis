export enum TrainingStatus {
  NOT_STARTED = 0,
  COMPLETED = 1, // all performed values == prescribed values
  PARTIAL = 2, // some performed value < prescribed value
  OVER = 3, // all performed values > prescribed values
}
