import { InstitutionRepository } from '../repository/institution.repository';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CommonService } from '../../common/service/common.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { Institution } from '../entity/institution.entity';
import { InstitutionRef } from '../../common/type/firestore.type';
import { User } from '../../common/type/firebase-auth.type';
import { Create } from '../../common/type/entity.type';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UserRole } from '../../user/enum/user-role.enum';
import { UserService } from '../../user/user.service';
import { FieldValue } from 'firebase-admin/firestore';
import { Permission } from '../../common/interface/permission.interface';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { UpdateInstitutionMembersDto } from '../dto/update-institution-members.dto';
import { UserEntity } from '../../user/entity/user.entity';

@Injectable()
export class InstitutionService implements Permission<Institution> {
  private logger = new Logger(InstitutionService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    private readonly repository: InstitutionRepository,
  ) {}

  async getDoc(ref: InstitutionRef): Promise<Institution | null> {
    return await this.repository.getDoc(ref.institutionId);
  }

  async getDocByOwner(ownerId: string): Promise<Institution | null> {
    return (
      await this.repository.getDocs((q) => q.where('ownerId', '==', ownerId))
    )?.[0];
  }

  async getDocByIdOrFail(ref: InstitutionRef): Promise<Institution> {
    const institution = await this.getDoc(ref);
    if (!institution) throw new BadRequestException('Institution not found');
    return institution;
  }

  async findAll(user: User): Promise<Institution[]> {
    return await this.repository.getDocs((q) =>
      this.firebaseService.isAdmin(user) // admin sees all institutions
        ? q
        : this.firebaseService.isManager(user) // institution owner
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
      ownerId: input.ownerId,
      athleteIds: [],
      trainerIds: [],
      name: input.name,
      imageUrl: input.imageUrl,
    };

    const query = this.firebaseService.buildCreateQuery(data, {
      timestamps: true,
    });

    const id = await this.repository.addDoc(query);
    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionDto,
  ): Promise<Institution> {
    this.logger.log(
      `User ${user.uid} is updating institution ${ref.institutionId}: ${JSON.stringify(input)}`,
    );

    const institution = await this.getDocByIdOrFail(ref);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    await this.repository.updateDoc(ref.institutionId, input);
    return { ...institution, ...this.commonService.object.clean(input) };
  }

  async findMembers(ref: InstitutionRef): Promise<UserEntity[]> {
    const institution = await this.getDocByIdOrFail(ref);
    const collection = this.userService.getCollection();

    return this.firebaseService.batchIn(
      'id',
      institution.athleteIds,
      collection,
    );
  }

  async updateMembers(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionMembersDto,
  ): Promise<Institution> {
    const { add, trainers, memberIds } = input;

    this.logger.log(
      `User ${user.uid} is ${add ? 'adding' : 'removing'} ${trainers ? 'trainers' : 'athletes'} to institution ${ref.institutionId}: ${JSON.stringify(
        input,
      )}`,
    );

    const institution = await this.getDocByIdOrFail(ref);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    await this.userService.findAllOrFail({
      ids: memberIds,
      role: trainers ? UserRole.TRAINER : UserRole.ATHLETE,
    });

    const membersField = trainers ? 'trainerIds' : 'athleteIds';
    const firebaseAction = add ? 'arrayUnion' : 'arrayRemove';

    const docRef = this.repository.collection().doc(institution.id);
    await docRef.update({
      [membersField]: FieldValue[firebaseAction](...memberIds),
    });

    return {
      ...institution,
      [membersField]: add
        ? [...institution[membersField], ...memberIds]
        : institution[membersField].filter((id) => memberIds.includes(id)),
    };
  }

  canView(user: User, institution: Institution) {
    // app admin
    if (this.firebaseService.isAdmin(user)) return true;

    // institution owner
    if (institution.ownerId === user.uid) return true;

    // institution trainer
    if (institution.trainerIds.includes(user.uid)) return true;

    // institution athlete
    if (institution.athleteIds.includes(user.uid)) return true;

    return false;
  }

  canEdit(user: User, institution: Institution) {
    // app admin
    if (this.firebaseService.isAdmin(user)) return true;

    // institution owner
    if (
      this.firebaseService.isManager(user) &&
      institution.ownerId === user.uid
    )
      return true;

    return false;
  }
}
