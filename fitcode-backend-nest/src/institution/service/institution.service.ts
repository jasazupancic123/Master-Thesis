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
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { CreateInstitutionDto } from '../dto/create-insitution.dto';
import { UserRole } from '../../user/enum/user-role.enum';
import { UserService } from '../../user/user.service';
import { Query } from 'firebase-admin/firestore';

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

  async findOne(user: User, ref: InstitutionRef): Promise<Institution | null> {
    // find institution
    const institution = await this.institutionRepository.getDoc(
      ref.institutionId,
    );
    if (!institution) return null;

    // authorize user
    if (
      !this.isAuthorized(user, institution) &&
      !this.firebaseService.isAdmin(user)
    )
      throw new UnauthorizedException(
        'You are not authorized to view this institution',
      );

    return institution;
  }

  async findOneOrFail(user: User, ref: InstitutionRef): Promise<Institution> {
    const institution = await this.findOne(user, ref);
    if (!institution) throw new BadRequestException('Institution not found');
    return institution;
  }

  private isAuthorized(user: User, institution: Institution): boolean {
    return institution.trainerIds.includes(user.uid);
  }

  async findAll(user: User): Promise<Institution[]> {
    if (!this.firebaseService.isAdmin(user))
      throw new UnauthorizedException(
        'You are not authorized to view this institutions',
      );

    let institutions = await this.institutionRepository.getDocs();

    return institutions;
  }

  async findAllByUser(user: User): Promise<Institution[]> {
    let query;
    if (this.firebaseService.isAdmin(user)) return this.findAll(user);
    else if (this.firebaseService.isTrainer(user)) {
      query = this.institutionRepository
        .collection()
        .where('trainerIds', 'array-contains', user.uid);
    } else if (this.firebaseService.isAthlete(user)) {
      query = this.institutionRepository
        .collection()
        .where('athleteIds', 'array-contains', user.uid);
    } else {
      throw new UnauthorizedException(
        'You are not authorized to view this institution',
      );
    }

    const instituions = await query.get().then((snapshot) => {
      return snapshot.docs.map((doc) =>
        this.firebaseService.serialize(
          doc.data() as FirestoreEntity<Institution>,
        ),
      );
    });

    return instituions;
  }

  async create(user: User, input: CreateInstitutionDto): Promise<Institution> {
    const { name } = input;

    this.logger.log(
      `User ${user.uid} is creating institution: ${JSON.stringify(input)}`,
    );

    if (!this.firebaseService.isAdmin(user))
      throw new UnauthorizedException(
        'You are not authorized to create an institution',
      );

    if (!input.ownerId) throw new BadRequestException('Owner ID is required');

    await this.validateTrainers(input.trainerIds); //trainer can only be in one institution

    const data: Create<Institution> = {
      id: null,
      name: name,
      ownerId: input.ownerId,
      trainerIds: input.trainerIds || [],
      athleteIds: input.athleteIds || [],
      groupIds: [],
      imageUrl: input.imageUrl,
    };

    const institutionDocRef = this.institutionRepository.collection().doc();
    const institution: Institution = {
      ...data,
      id: institutionDocRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createInstitutionQuery =
      this.firebaseService.buildCreateQuery<Institution>(
        { ...data, id: institution.id },
        { timestamps: true },
      );

    const batch = this.firebaseService.firestore.batch();
    batch.set(institutionDocRef, createInstitutionQuery);

    await batch.commit();

    return institution;
  }

  async addAthletes(
    user: User,
    ref: InstitutionRef,
    input: { athleteIds: string[] },
  ): Promise<Institution> {
    this.logger.log(
      `User ${user.uid} is adding athletes to institution ${ref.institutionId}: ${JSON.stringify(
        input,
      )}`,
    );

    const { athleteIds } = input;

    const institution = await this.findOneOrFail(user, {
      institutionId: ref.institutionId,
    });

    // validate is trainer
    this.validateIsTrainer(user, institution);

    const athletes = await this.validateMembers(athleteIds, UserRole.ATHLETE);

    // update fields in a single query
    await this.institutionRepository.updateDoc(ref.institutionId, {
      athleteIds: [...institution.athleteIds, ...athletes.map((a) => a.uid)],
    });

    return {
      ...institution,
      athleteIds: [...institution.athleteIds, ...athletes.map((a) => a.uid)],
    } as Institution;
  }

  async removeAthletes(
    user: User,
    ref: InstitutionRef,
    input: { athleteIds: string[] },
  ): Promise<Institution> {
    this.logger.log(
      `User ${user.uid} is removing athletes from institution ${ref.institutionId}: ${JSON.stringify(
        input,
      )}`,
    );

    const { athleteIds } = input;

    const institution = await this.findOneOrFail(user, {
      institutionId: ref.institutionId,
    });

    // validate is trainer
    this.validateIsTrainer(user, institution);

    // update fields in a single query
    await this.institutionRepository.updateDoc(ref.institutionId, {
      athleteIds: institution.athleteIds.filter(
        (id) => !athleteIds.includes(id),
      ),
    });

    return {
      ...institution,
      athleteIds: institution.athleteIds.filter(
        (id) => !athleteIds.includes(id),
      ),
    } as Institution;
  }

  async update(
    user: User,
    ref: InstitutionRef,
    input: Update<
      Institution,
      'name' | 'athleteIds' | 'groupIds' | 'trainerIds' | 'imageUrl'
    >,
  ): Promise<Institution> {
    this.logger.log(
      `User ${user.uid} is updating institution ${ref.institutionId}: ${JSON.stringify(input)}`,
    );

    const institution = await this.findOneOrFail(user, ref);

    // validate user as trainer in institution
    this.validateIsTrainer(user, institution);

    if (input.athleteIds)
      await this.validateMembers(
        input.athleteIds as string[],
        UserRole.ATHLETE,
      );

    if (input.trainerIds)
      await this.validateMembers(
        input.trainerIds as string[],
        UserRole.TRAINER,
      );

    // update fields in a single query
    await this.institutionRepository.updateDoc(ref.institutionId, input);

    const updatedInstitution = {
      ...institution,
      ...this.commonService.object.clean(input),
    };

    return updatedInstitution as Institution;
  }

  private validateIsTrainer(user: User, institution: Institution) {
    if (!institution.trainerIds.includes(user.uid))
      throw new UnauthorizedException(
        'You are not authorized to update this institution',
      );
  }

  private async validateMembers(
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

  private async validateTrainers(trainerIds: string[]) {
    if (trainerIds.length === 0) return;

    for (const id of trainerIds) {
      const institutions = await this.getInstitutionsByTrainerId(id);

      if (institutions.length > 0) {
        throw new BadRequestException(
          `Some trainers are already in other institutions`,
        );
      }
    }
  }

  private async getInstitutionsByTrainerId(
    trainerId: string,
  ): Promise<Institution[]> {
    const institutions = await this.getDocs((query) =>
      query.where('trainerIds', 'array-contains', trainerId),
    ).then((snapshot) => {
      return snapshot.docs.map((doc) =>
        this.firebaseService.serialize(
          doc.data() as FirestoreEntity<Institution>,
        ),
      );
    });

    return institutions;
  }
}
