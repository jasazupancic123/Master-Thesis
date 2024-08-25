import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CommonService } from '../common/service/common.service';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { SuperExerciseInfo } from './entity/super-exercise-info.entity';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { ExerciseInfo } from './entity/exercise-info.entity';
import { WorkloadType } from './enum/workload-type.enum';
import { User } from '../common/type/custom-claims.type';
import { SetService } from '../set/set.service';
import { Wrapper } from '../common/type/wrapper.type';
import { SetType } from './enum/set-type.enum';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ExerciseInfoService {
  private readonly logger = new Logger(ExerciseInfoService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(SuperExerciseInfo)
    private readonly superExerciseInfoRepository: FirestoreRepository<SuperExerciseInfo>,
    @InjectRepository(ExerciseInfo)
    private readonly exerciseInfoRepository: FirestoreRepository<ExerciseInfo>,
    @Inject(forwardRef(() => SetService)) private readonly setService: Wrapper<SetService>,
  ) {
  }

  async findInfoBySetExerciseId(setExerciseId: string, filter?: { memberId?: string }) {
    const superExerciseInfo = await this.superExerciseInfoRepository.findOneBy('setExerciseId', setExerciseId);

    if (filter?.memberId) {
      // return super exercise info and exercise info for a specific user
      const exerciseInfo = await this.exerciseInfoRepository.findOneBy('userId', filter.memberId);
      return { superExerciseInfo, exerciseInfo: [exerciseInfo] };
    }

    // return super exercise info and exercise info for all users
    const exerciseInfo = await this.exerciseInfoRepository.findAllBy('setExerciseId', setExerciseId);
    return { superExerciseInfo, exerciseInfo };
  }

  /**
   * Creates super exercise info and exercise infos for all users.
   */
  async create(
    user: User,
    setExerciseId: string,
    members: User[],
    data: Partial<SuperExerciseInfo>,
  ) {
    const exercise = await this.setService.findExerciseBySetExerciseId(user, setExerciseId);

    // create super exercise info
    const superExerciseInfo = await this.superExerciseInfoRepository.create({
      ...data,
      setExerciseId,
    });

    // create exercise info for each exercise for each user
    const input: Partial<ExerciseInfo>[] = await Promise.all(members.map(async (member) => ({
      setExerciseId,
      userId: member.uid,
      completed: false,
      value: await this.calculateValueFromWorkloadType(data.workloadType, data.workloadValue, member, exercise.id),
    })));

    const exerciseInfo = await this.exerciseInfoRepository.createMany(input);
    return { superExerciseInfo, exerciseInfo };
  }

  /**
   * Updates super exercise info and exercise infos for all users
   * by re-calculating values for exercise info based on the new super exercise
   * info values
   */
  async update(setExerciseId: string, data: Partial<SuperExerciseInfo>) {
    const {
      superExerciseInfo,
      exerciseInfo,
    } = await this.findInfoBySetExerciseId(setExerciseId);

    // update super exercise info
    const updatedSuperExerciseInfo = await this.superExerciseInfoRepository.update(superExerciseInfo.id, {
      sets: data.sets,
      setType: data.setType,
      setTypeValue: data.setTypeValue,
      workloadType: data.workloadType,
      workloadValue: data.workloadValue,
      rec: data.rec,
      tempo: data.tempo,
      effort: data.effort,
    });

    // update exercise info for all users if workload type or value changed
    const isWorkloadTypeChanged = data.workloadType !== superExerciseInfo.workloadType;
    const isWorkloadValueChanged = data.workloadValue !== superExerciseInfo.workloadValue;

    let updatedExerciseInfo: ExerciseInfo[];
    if (isWorkloadTypeChanged || isWorkloadValueChanged) {
      this.logger.debug(`Updating exercise info (old: ${superExerciseInfo.workloadType} -> ${superExerciseInfo.workloadValue}, new: ${data.workloadType} -> ${data.workloadValue})`);

      updatedExerciseInfo = await Promise.all(exerciseInfo.map(async (info) => {
        const member = await this.firebaseService.findUserById(info.userId);
        const exercise = await this.setService.findExerciseBySetExerciseId(member, setExerciseId);

        // if type changed, set value to default type value, else recalculate value
        const value = isWorkloadTypeChanged
          ? 10
          : await this.calculateValueFromWorkloadType(data.workloadType, data.workloadValue, member, exercise.id);

        return await this.exerciseInfoRepository.update(info.id, { value });
      }));
    }

    return {
      superExerciseInfo: updatedSuperExerciseInfo,
      exerciseInfo: updatedExerciseInfo,
    };
  }

  async deleteAllBySetExerciseId(setExerciseId: string) {
    const { superExerciseInfo, exerciseInfo } = await this.findInfoBySetExerciseId(setExerciseId);
    await this.superExerciseInfoRepository.delete(superExerciseInfo.id);
    await this.exerciseInfoRepository.deleteMany(exerciseInfo.map((info) => info.id));
  }

  private async calculateValueFromWorkloadType(
    type: WorkloadType,
    value: number,
    member: User,
    exerciseId: string,
  ) {
    switch (type) {
      case WorkloadType.RM:
        // fetch 1RM from last month of user exercises, use formula and save value as KG
        const values = await this.getMemberExerciseValues(member, exerciseId);
        return this.commonService.calculateRM(values);
      case WorkloadType.BW:
        // fetch body weight from user's profile and save % of it as KG
        const bodyweight = member.customClaims.bodyweight || 0;
        return bodyweight * this.commonService.percentFromValue(value);
      case WorkloadType.INT:
      case WorkloadType.KG:
      default:
        return value;
    }
  }

  private async getMemberExerciseValues(member: User, exerciseId: string) {
    // fetch all exercises for user from last month
    const setExercises = await this.setService.findAllSetExercisesByMemberAndExerciseId(member, exerciseId);

    const data = setExercises.map(({ exerciseInfo, superExerciseInfo }) => {
      switch (superExerciseInfo.setType) {
        case SetType.REPS:
          return {
            reps: superExerciseInfo.setTypeValue,
            weight: exerciseInfo?.[0]?.value || 0,
          };
        default:
          return null;
      }
    });

    // return only non-null values
    return data.filter((item) => item);
  }
}