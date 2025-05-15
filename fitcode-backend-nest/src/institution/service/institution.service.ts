import { InstitutionRepository } from '../repository/institution.repository';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { CommonService } from '../../common/service/common.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { GroupService } from '../../group/group.service';
import { Institution } from '../entity/institution.entity';
import { InstitutionRef, UserRef } from 'src/common/type/firestore.type';
import { User } from 'src/common/type/firebase-auth.type';
import { Create, FirestoreEntity } from 'src/common/type/entity.type';
import { CreateInstitutionDto } from '../dto/create-insitution.dto';
import { UserRole } from 'src/user/enum/user-role.enum';

@Injectable()
export class InstitutionService {
  private logger = new Logger(InstitutionService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly institutionRepository: InstitutionRepository,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
  ) {}

  async findOne(user: User, ref: InstitutionRef): Promise<Institution | null> {
    // find institution
    const institution = await this.institutionRepository.getDoc(
      ref.institutionId,
    );
    if (!institution) return null;

    // authorize user
    if (!this.isAuthorized(user, institution))
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

  async findByTrainerId(user: User, ref: UserRef): Promise<Institution[]> {
    let query = this.institutionRepository
      .collection()
      .where('trainerIds', 'array-contains', ref.uid);

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

    const data: Create<Institution> = {
      id: null,
      name: name,
      trainerIds: input.trainerIds || [],
      athleteIds: input.athleteIds || [],
      groupIds: [],
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
}
