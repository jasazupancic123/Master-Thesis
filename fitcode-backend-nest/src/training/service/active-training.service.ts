import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthService } from '@src/auth/service/auth.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { User } from '@src/common/type/firebase-auth.type';
import {
  TrainingComponentRef,
  TrainingComponentUserStatusRef,
  UserRef,
} from '@src/common/type/firestore.type';
import { ValidateError } from '@src/common/type/validate.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { Components } from '@src/exercise/constant/components.constant';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingComponentUserStatus } from '../entity/training-component-user-status.entity';
import { Workload } from '../entity/workload.entity';
import { TrainingStatus } from '../enum/training-status.enum';
import { TrainingComponentUserStatusRepository } from '../repository/training-component-user-status.repository';
import { TrainingService } from './training.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class ActiveTrainingService {
  constructor(
    private readonly firebase: FirebaseService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly trainingService: TrainingService,
    private readonly trainingComponentUserStatusRepository: TrainingComponentUserStatusRepository,
    private readonly workloadService: WorkloadService,
  ) {}

  /**
   * This method will initialize training reports for specified users.
   * If the provided component has status NOT_STARTED or PAUSED, it will
   * put it into IN_PROGRESS mode.
   */
  @LogMethod()
  async startTrainingComponent(
    user: User,
    ref: TrainingComponentRef,
    uid?: string,
  ): Promise<{
    trainings: Record<string, Training>;
    errors: ValidateError<Record<string, unknown>>[];
  }> {
    const training = await this.trainingService.findOneByIdOrFail(user, ref);
    this.checkComponentExists(training, ref.componentId);
    this.trainingService.validateIsToday(training.from);

    const memberIds = await this.getMemberIdsForTrainingReport(
      user,
      training,
      uid,
    );

    // get individual training for each member
    const trainings = await this.trainingService.findAllIndividual(
      training,
      memberIds,
    ); // <userId, training>

    const errors: ValidateError<Record<string, unknown>>[] = [];
    let input = memberIds.map((userId) => ({
      uid: userId,
      componentId: ref.componentId,
      training: trainings[userId],
    }));

    // check if any other training is already active
    for (const { uid } of input) {
      const activeTrainingId =
        await this.trainingComponentUserStatusRepository.getActiveTrainingId(
          uid,
        );

      if (activeTrainingId && activeTrainingId !== input[0].training.id) {
        if (this.firebase.isAthlete(user)) {
          // athlete cannot start new training if another is active
          errors.push({ field: uid, message: 'ACTIVE_TRAINING_EXISTS' });
          continue;
        } else {
          // trainer/manager can start new training, but we need to finalize existing active training first
          await this.trainingComponentUserStatusRepository.update(
            { trainingId: activeTrainingId, componentId: ref.componentId, uid },
            { status: TrainingStatus.COMPLETED },
          );
        }
      }
    }

    // remove user ids from input that are in error state
    input = input.filter(({ uid }) => !errors.find((e) => e.field === uid));

    // if training report exists, then just update the correct component status to in_progress, else create new report
    for (const { uid, training, componentId } of input) {
      const ref: TrainingComponentUserStatusRef = {
        trainingId: training.id,
        componentId,
        uid,
      };

      let existing =
        await this.trainingComponentUserStatusRepository.findById(ref);

      if (existing) {
        if (existing.status === TrainingStatus.IN_PROGRESS) continue;

        // athlete cannot restart completed component, only trainer/manager can
        if (
          this.firebase.isAthlete(user) &&
          existing.status === TrainingStatus.COMPLETED
        ) {
          errors.push({ field: uid, message: 'COMPONENT_COMPLETED' });
          continue;
        }

        await this.trainingComponentUserStatusRepository.update(ref, {
          status: TrainingStatus.IN_PROGRESS,
        });
      } else
        await this.trainingComponentUserStatusRepository.save({
          id: null,
          from: new Date(),
          to: new Date(),
          institutionId: training.institutionId,
          groupId: training.groupId,
          cycleId: training.cycleId,
          trainingId: training.id,
          componentId,
          userId: uid,
          status: TrainingStatus.IN_PROGRESS,
          realization: 0,
          reps: 0,
          dist: 0,
          time: 0,
          exercises: 0,
          sets: 0,
          tonnage: 0,
          tut: 0,
          recTime: 0,
          recDist: 0,
        });
    }

    return { trainings, errors };
  }

  /**
   * Completes training component for specified users. It only finalizes
   * components that are in IN_PROGRESS or PAUSED status.
   */
  @LogMethod()
  async completeTrainingComponent(
    user: User,
    ref: TrainingComponentRef,
    uid?: string,
  ): Promise<{ errors: ValidateError<Record<string, unknown>>[] }> {
    const training = await this.trainingService.findOneByIdOrFail(user, ref);
    this.checkComponentExists(training, ref.componentId);

    // finalize training reports
    const memberIds = await this.getMemberIdsForTrainingReport(
      user,
      training,
      uid,
    );

    const workloads = await this.workloadService.findAllByUserTraining({
      trainingId: training.id,
    });

    const errors: ValidateError<Record<string, unknown>>[] = [];
    for (const userId of memberIds) {
      const statusRef: TrainingComponentUserStatusRef = { ...ref, uid: userId };
      const status =
        await this.trainingComponentUserStatusRepository.findById(statusRef);

      if (!status || status.status === TrainingStatus.NOT_STARTED) {
        errors.push({ field: userId, message: 'COMPONENT_NOT_STARTED' });
        continue;
      }

      if (status.status === TrainingStatus.COMPLETED) {
        errors.push({ field: userId, message: 'COMPONENT_COMPLETED' });
        continue;
      }

      await this.trainingService.upsertTrainingComponentStatus(
        training,
        statusRef,
        workloads,
      );
    }

    return { errors };
  }

  /**
   * Pauses training component. Only components that are in IN_PROGRESS status
   * can be paused. Note that trainer will not be able to pause training reports
   * for all athletes. He cannot pause training at all, only athlete can for himself.
   */
  @LogMethod()
  async pauseComponent(user: User, ref: TrainingComponentRef): Promise<void> {
    const training = await this.trainingService.findOneByIdOrFail(user, ref);
    this.checkComponentExists(training, ref.componentId);
    this.trainingService.validateIsToday(training.from);

    const statusRef: TrainingComponentUserStatusRef = { ...ref, uid: user.uid };
    const status =
      await this.trainingComponentUserStatusRepository.findById(statusRef);

    if (!status)
      throw new BadRequestException('Training component not started');

    // can only pause component that is in IN_PROGRESS status
    if (status.status !== TrainingStatus.IN_PROGRESS)
      throw new BadRequestException(
        'You can only pause training that is currently in progress',
      );

    await this.trainingComponentUserStatusRepository.update(statusRef, {
      status: TrainingStatus.PAUSED,
    });
  }

  async generateQRCode(
    user: User,
    ref: TrainingComponentRef & UserRef,
  ): Promise<string> {
    const athlete = await this.trainingService.getAthlete(user, ref.uid);
    const { trainings } = await this.startTrainingComponent(
      athlete,
      ref,
      ref.uid,
    );

    const training = trainings[athlete.uid];
    return await this.authService.createMagicLink(
      user,
      athlete.uid,
      `/home/${training.id}/components/${ref.componentId}`,
    );
  }

  /**
   * Returns all trainings that are currently in progress for today.
   * Each user can only have one active training at a time. If `user`
   * is athlete, only 1 training is returned. If user is coach, 1
   * training for each of the athletes is returned.
   */
  async getActiveTrainingByAthlete(
    user: User,
    athleteId: string,
  ): Promise<
    | (Training & {
        workloads: Workload[];
        statuses: TrainingComponentUserStatus[];
      })
    | null
  > {
    const athlete = await this.trainingService.getAthlete(user, athleteId);
    const trainingId =
      await this.trainingComponentUserStatusRepository.getActiveTrainingId(
        athlete.uid,
      );

    if (!trainingId) return null;

    const training = await this.trainingService.findOneByIdOrFail(user, {
      trainingId,
    });

    const individualTraining = await this.trainingService.getTrainingByAthlete(
      athlete.uid,
      training,
    );

    const statuses =
      await this.trainingComponentUserStatusRepository.findAllByUserTraining(
        athlete.uid,
        trainingId,
      );

    return { ...individualTraining, statuses };
  }

  async completePastActiveTrainingsForAthlete(userId: string) {
    await this.trainingComponentUserStatusRepository.completePastActiveTrainingsForAthlete(
      userId,
    );
  }

  private async getMemberIdsForTrainingReport(
    user: User, // trainer or athlete
    training: Training,
    uid?: string, // trainer can also provide only 1 athlete
  ): Promise<string[]> {
    // initialize training reports
    //   - if user is manager/trainer, then for all members OR for the specified athlete
    //   - if user is athlete, then only for himself

    if (this.firebase.isTrainer(user) || this.firebase.isManager(user)) {
      if (uid) {
        const athlete = await this.trainingService.getAthlete(
          user,
          uid,
          training.institution,
        );
        return [athlete.uid];
      }

      return training.membersIds;
    }

    return [user.uid];
  }

  private checkComponentExists(
    training: Training,
    componentId: string,
  ): TrainingComponent {
    const component = training.components.find((c) => c.id === componentId);
    if (!component) {
      const name =
        Components.find((c) => c.field === componentId)?.name || 'Component';
      throw new NotFoundException(`${name} not found`);
    }

    return component;
  }
}
