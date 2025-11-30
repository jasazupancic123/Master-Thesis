import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthService } from '@src/auth/service/auth.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import {
  InstitutionMemberRef,
  InstitutionRef,
} from '@src/common/type/firestore.type';
import { BatchUpdateOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { AuthProfileMerged } from '@src/profile/type/auth-profile-merged.type';
import { TrainingProtocol } from '@src/training/entity/training-protocol.entity';

import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { UpdateInstitutionMemberDto } from '../dto/update-institution-members.dto';
import { Group } from '../entity/group.entity';
import { InitInstitution, Institution } from '../entity/institution.entity';
import {
  InstitutionMember,
  PartialInstitutionMember,
} from '../entity/institution-member.entity';
import { GroupRepository } from '../repository/group.repository';
import { InstitutionRepository } from '../repository/institution.repository';
import { InstitutionMembersRepository } from '../repository/institution-members.repository';
import { ProtocolRepository } from '../repository/protocol.repository';
import { MemberService } from './member.service';

@Injectable()
export class InstitutionService implements Permission<Institution> {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly common: CommonService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly repository: InstitutionRepository,
    private readonly groupRepository: GroupRepository,
    private readonly membersRepository: InstitutionMembersRepository,
    private readonly protocolRepository: ProtocolRepository,
    private readonly memberService: MemberService,
  ) {}

  async findById(
    user: User,
    institutionId: string,
  ): Promise<Institution | null> {
    const institution = await this.repository.findById(institutionId);
    if (!institution) return null;
    if (!this.canView(user, institution))
      throw new UnauthorizedException('You cannot view this institution');

    return institution;
  }

  async findByOwnerId(ownerId: string): Promise<Institution | null> {
    return (await this.repository.findOneByManager(ownerId))?.[0];
  }

  async findByIdOrFail(
    user: User,
    institutionId: string,
  ): Promise<Institution> {
    const institution = await this.findById(user, institutionId);
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async findAll(user: User): Promise<Institution[]> {
    switch (this.firebase.getRole(user)) {
      case UserRole.ADMIN:
        return await this.repository.findAll();
      case UserRole.MANAGER:
        return await this.repository.findOneByManager(user.uid);
      case UserRole.TRAINER:
      case UserRole.ATHLETE:
        return await this.repository.findAllByMember(user.uid);
      default:
        return [];
    }
  }

  @LogMethod()
  async findAllGroups(user: User, institutionId: string): Promise<Group[]> {
    await this.findByIdOrFail(user, institutionId);
    return await this.groupRepository.getAllByInstitution({ institutionId });
  }

  @LogMethod()
  async findAllMembers(
    user: User,
    institutionId: string,
  ): Promise<AuthProfileMerged[]> {
    const institution = await this.findByIdOrFail(user, institutionId);
    return await this.memberService.findAllByInstitution(institution);
  }

  @LogMethod()
  async findAllProtocols(
    user: User,
    institutionId: string,
  ): Promise<TrainingProtocol[]> {
    const institution = await this.findByIdOrFail(user, institutionId);
    if (!this.canView(user, institution))
      throw new UnauthorizedException('You cannot view this institution');

    const ref: InstitutionRef = { institutionId };
    return await this.protocolRepository.getAllByInstitution(ref);
  }

  @LogMethod()
  async init(user: User, institutionId: string): Promise<InitInstitution> {
    const institution = await this.findByIdOrFail(user, institutionId);
    const groups = await this.groupRepository.getAllByInstitution({
      institutionId,
    });

    return { ...institution, groups };
  }

  @LogMethod()
  async create(user: User, input: CreateInstitutionDto): Promise<Institution> {
    if (!this.firebase.isAdmin(user))
      throw new UnauthorizedException('Only admin can create institutions');

    const owner = await this.authService.findOneBy('id', input.ownerId);
    if (!owner)
      throw new BadRequestException(
        'Owner of the new institution does not exist',
      );

    if (!this.firebase.isManager(owner))
      throw new BadRequestException(
        'Owner of the institution must be a manager',
      );

    const data: Create<Omit<Institution, 'members'>> = {
      id: null,
      ownerId: input.ownerId,
      name: input.name,
      imageUrl: input.imageUrl,
    };

    const query = this.firebase.buildCreateQuery(data, {
      timestamps: true,
    });

    const id = await this.repository.save(query);
    return {
      ...data,
      id,
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @LogMethod()
  async update(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionDto,
  ): Promise<Institution> {
    const institution = await this.findByIdOrFail(user, ref.institutionId);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    await this.repository.update(ref.institutionId, input);
    return { ...institution, ...this.common.object.clean(input) };
  }

  @LogMethod()
  async updateMember(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionMemberDto,
  ) {
    const institution = await this.findByIdOrFail(user, ref.institutionId);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    await this.memberService.addOrRemove(institution, input);
  }

  async addMember(
    data: Pick<InstitutionMember, 'role'>,
    ref: InstitutionMemberRef,
  ) {
    await this.membersRepository.addMember(data, ref);
  }

  getIncrementExerciseRevisionsOperation(
    institutionId: string,
  ): BatchUpdateOperation<Institution> {
    return {
      operation: 'update',
      ref: this.repository.collection().doc(institutionId),
      data: {
        exerciseRevisions: FieldValue.increment(1),
      } as unknown as FirestoreEntity<Institution>,
    };
  }

  getMemberIds(institution: Institution): string[] {
    return [institution.ownerId, ...institution.members.map((m) => m.id)];
  }

  getTrainers(institution: Institution): PartialInstitutionMember[] {
    return institution.members.filter((m) => m.role === UserRole.TRAINER);
  }

  getAthletes(institution: Institution): PartialInstitutionMember[] {
    return institution.members.filter((m) => m.role === UserRole.ATHLETE);
  }

  isManager(institution: Institution, user: User): boolean {
    if (!institution) return false;
    return this.firebase.isManager(user) && institution.ownerId === user.uid;
  }

  isTrainer(institution: Institution, user: User): boolean {
    if (!institution) return false;
    return (
      this.firebase.isTrainer(user) &&
      this.getTrainers(institution).some((t) => t.id === user.uid)
    );
  }

  isAthlete(institution: Institution, user: User): boolean {
    if (!institution) return false;
    return (
      this.firebase.isAthlete(user) &&
      this.getAthletes(institution).some((a) => a.id === user.uid)
    );
  }

  canView(user: User, institution: Institution) {
    if (this.firebase.isAdmin(user)) return true;
    if (this.isManager(institution, user)) return true;
    if (this.isTrainer(institution, user)) return true;
    if (this.isAthlete(institution, user)) return true;
    return false;
  }

  canEdit(user: User, institution: Institution) {
    if (this.firebase.isAdmin(user)) return true;
    if (this.isManager(institution, user)) return true;
    return false;
  }

  canEditExtended(
    user: User,
    institution: Institution,
    options?: { allowTrainer?: boolean; allowAthlete?: boolean },
  ) {
    if (options?.allowTrainer && this.isTrainer(institution, user)) return true;
    if (options?.allowAthlete && this.isAthlete(institution, user)) return true;
    return this.canEdit(user, institution);
  }
}
