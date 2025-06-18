import { InstitutionRepository } from '../repository/institution.repository';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CommonService } from '../../common/service/common.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Institution } from '../entity/institution.entity';
import { InstitutionRef } from '../../common/type/firestore.type';
import { User } from '../../common/type/firebase-auth.type';
import { Create, Update } from '../../common/type/entity.type';
import { CreateInstitutionDto } from '../dto/create-insitution.dto';
import { UserRole } from '../../user/enum/user-role.enum';
import { UserService } from '../../user/user.service';
import { FieldValue, Query } from 'firebase-admin/firestore';

@Injectable()
export class InstitutionService {
  private logger = new Logger(InstitutionService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
    private readonly institutionRepository: InstitutionRepository,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return query(this.institutionRepository.collection()).get();
  }

  async findOne(ref: InstitutionRef): Promise<Institution | null> {
    const institution = await this.institutionRepository.getDoc(
      ref.institutionId,
    );

    if (!institution) return null;
    return institution;
  }

  async findOneOrFail(ref: InstitutionRef): Promise<Institution> {
    const institution = await this.findOne(ref);
    if (!institution) throw new BadRequestException('Institution not found');
    return institution;
  }

  async findAll(user: User): Promise<Institution[]> {
    return await this.institutionRepository.getDocs((q) =>
      this.firebaseService.isAdmin(user)
        ? q
        : this.firebaseService.isManager(user)
          ? q.where('ownerId', '==', user.uid)
          : this.firebaseService.isTrainer(user)
            ? q.where('trainerIds', 'array-contains', user.uid)
            : q.where('athleteIds', 'array-contains', user.uid),
    );
  }

  async create(user: User, input: CreateInstitutionDto): Promise<Institution> {
    this.logger.log(
      `User ${user.uid} is creating institution: ${JSON.stringify(input)}`,
    );

    const athletes = await this.findMembers(input.athleteIds, UserRole.ATHLETE);
    const trainers = await this.findMembers(input.trainerIds, UserRole.TRAINER);

    const owner = await this.userService.findOneBy('id', input.ownerId);
    if (!owner)
      throw new BadRequestException(
        'Owner of the new institution does not exist',
      );

    if (!this.firebaseService.isManager(owner))
      throw new BadRequestException(
        'Owner of the institution must be a manager',
      );

    const data: Create<Institution> = {
      id: null,
      name: input.name,
      ownerId: input.ownerId,
      athleteIds: athletes.map((a) => a.uid),
      trainerIds: trainers.map((a) => a.uid),
      groupIds: [],
      imageUrl: input.imageUrl,
    };

    const query = this.firebaseService.buildCreateQuery<Institution>(data, {
      timestamps: true,
    });

    const id = await this.institutionRepository.addDoc(query);
    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async addAthletes(
    user: User,
    ref: InstitutionRef,
    input: Pick<Institution, 'athleteIds'>,
  ): Promise<Institution> {
    const { institutionId } = ref;
    this.logger.log(
      `User ${user.uid} is adding athletes to institution ${institutionId}: ${JSON.stringify(
        input,
      )}`,
    );

    const institution = await this.findOneOrFail({ institutionId });
    this.validateManager(user, institution);

    const athletes = await this.findMembers(input.athleteIds, UserRole.ATHLETE);
    const newAthleteIds = athletes.map((athlete) => athlete.uid);

    const docRef = this.institutionRepository.collection().doc(institution.id);
    await docRef.update({
      athleteIds: FieldValue.arrayUnion(...newAthleteIds),
    });

    return {
      ...institution,
      athleteIds: [...institution.athleteIds, ...athletes.map((a) => a.uid)],
    };
  }

  async removeAthletes(
    user: User,
    ref: InstitutionRef,
    input: Pick<Institution, 'athleteIds'>,
  ): Promise<Institution> {
    const { institutionId } = ref;
    this.logger.log(
      `User ${user.uid} is removing athletes from institution ${institutionId}: ${JSON.stringify(
        input,
      )}`,
    );

    const institution = await this.findOneOrFail({ institutionId });
    this.validateManager(user, institution);

    const athletes = await this.findMembers(input.athleteIds, UserRole.ATHLETE);
    const athleteIdsToRemove = athletes.map((athlete) => athlete.uid);

    const docRef = this.institutionRepository.collection().doc(institution.id);
    await docRef.update({
      athleteIds: FieldValue.arrayRemove(...athleteIdsToRemove),
    });

    return {
      ...institution,
      athleteIds: institution.athleteIds.filter(
        (id) => !athleteIdsToRemove.includes(id),
      ),
    };
  }

  async addTrainers(
    user: User,
    ref: InstitutionRef,
    input: Pick<Institution, 'trainerIds'>,
  ): Promise<Institution> {
    const { institutionId } = ref;
    this.logger.log(
      `User ${user.uid} is adding trainers to institution ${institutionId}: ${JSON.stringify(
        input,
      )}`,
    );

    const institution = await this.findOneOrFail({ institutionId });
    this.validateManager(user, institution);

    const trainers = await this.findMembers(input.trainerIds, UserRole.TRAINER);
    const newTrainerIds = trainers.map((trainer) => trainer.uid);

    const docRef = this.institutionRepository.collection().doc(institution.id);
    await docRef.update({
      athleteIds: FieldValue.arrayUnion(...newTrainerIds),
    });

    return {
      ...institution,
      trainerIds: [...institution.athleteIds, ...trainers.map((a) => a.uid)],
    };
  }

  async removeTrainers(
    user: User,
    ref: InstitutionRef,
    input: Pick<Institution, 'trainerIds'>,
  ): Promise<Institution> {
    const { institutionId } = ref;
    this.logger.log(
      `User ${user.uid} is removing trainers from institution ${institutionId}: ${JSON.stringify(
        input,
      )}`,
    );

    const institution = await this.findOneOrFail({ institutionId });
    this.validateTrainer(user, institution);

    const trainers = await this.findMembers(input.trainerIds, UserRole.TRAINER);
    const trainerIdsToRemove = trainers.map((trainer) => trainer.uid);

    const docRef = this.institutionRepository.collection().doc(institution.id);
    await docRef.update({
      trainerIds: FieldValue.arrayRemove(trainerIdsToRemove),
    });

    return {
      ...institution,
      trainerIds: institution.trainerIds.filter(
        (id) => !trainerIdsToRemove.includes(id),
      ),
    };
  }

  async update(
    user: User,
    ref: InstitutionRef,
    input: Update<Institution, 'name' | 'groupIds' | 'athleteIds' | 'imageUrl'>,
  ): Promise<Institution> {
    this.logger.log(
      `User ${user.uid} is updating institution ${ref.institutionId}: ${JSON.stringify(input)}`,
    );

    const institution = await this.findOneOrFail(ref);
    this.validateManager(user, institution);

    // if (input.groupIds) await this.validateGroups(input.groupIds);
    // if (input.athleteIds) await this.findMembers(input.athleteIds, UserRole.ATHLETE)

    await this.institutionRepository.updateDoc(ref.institutionId, input);
    return { ...institution, ...this.commonService.object.clean(input) };
  }

  private async findMembers(
    membersIds: string[],
    requiredRole?: UserRole,
  ): Promise<User[]> {
    if (membersIds.length === 0) return [];

    const members = await this.userService.findAllOrFail({ ids: membersIds });
    if (members.length !== membersIds.length)
      throw new BadRequestException('Invalid members provided');

    if (requiredRole) {
      const invalidMembers = members.filter(
        (member) => !member.customClaims.role.includes(requiredRole),
      );

      if (invalidMembers.length > 0)
        throw new BadRequestException('Invalid members provided');
    }

    return members;
  }

  private validateAdmin(user: User) {
    if (!this.firebaseService.isAdmin(user))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private validateManager(user: User, institution: Institution) {
    if (institution.ownerId !== user.uid)
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private validateTrainer(user: User, institution: Institution) {
    if (!institution.trainerIds.includes(user.uid))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }
}
