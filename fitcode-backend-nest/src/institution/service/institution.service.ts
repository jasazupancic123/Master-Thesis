import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthService } from '@src/auth/service/auth.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import {
  InstitutionMemberRef,
  InstitutionRef,
  TrainingProtocolRef,
} from '@src/common/type/firestore.type';
import { BatchOperation, BatchWriteOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Profile } from '@src/profile/entity/profile.entity';
import { ProfileService } from '@src/profile/service/profile.service';
import { TrainingProtocol } from '@src/training/entity/training-protocol.entity';

import { INSTITUTION_ATHLETE_EVENT } from '../constant/update-institution-athlete-event.constant';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { UpdateInstitutionMemberDto } from '../dto/update-institution-members.dto';
import { Institution } from '../entity/institution.entity';
import { InstitutionMember } from '../entity/institution-member.entity';
import { UpdateInstitutionAthleteEvent } from '../event/update-institution-athlete.event';
import { InstitutionRepository } from '../repository/institution.repository';
import { InstitutionMembersRepository } from '../repository/institution-members.repository';
import { ProtocolRepository } from '../repository/protocol.repository';

@Injectable()
export class InstitutionService implements Permission<Institution> {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly commonService: CommonService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly repository: InstitutionRepository,
    private readonly profileService: ProfileService,
    private readonly membersRepository: InstitutionMembersRepository,
    private readonly protocolRepository: ProtocolRepository,
  ) {}

  async findById(ref: InstitutionRef): Promise<Institution | null> {
    return await this.repository.findById(ref.institutionId);
  }

  async findByOwnerId(ownerId: string): Promise<Institution | null> {
    return (
      await this.repository.findAll((q) => q.where('ownerId', '==', ownerId))
    )?.[0];
  }

  async findByIdOrFail(ref: InstitutionRef): Promise<Institution> {
    const institution = await this.findById(ref);
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async findAll(user: User): Promise<Institution[]> {
    switch (this.firebase.getRole(user)) {
      case UserRole.ADMIN:
        return await this.repository.findAllByAdmin();
      case UserRole.MANAGER:
        return await this.repository.findAllByManager(user.uid);
      case UserRole.TRAINER:
      case UserRole.ATHLETE:
        return await this.repository.findAllByMember(user.uid);
      default:
        return [];
    }
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

    const data: Create<Omit<Institution, 'trainerIds' | 'athleteIds'>> = {
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
      trainerIds: [],
      athleteIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async checkCanEditProtocols(user: User, institutionId: string) {
    const institution = await this.findByIdOrFail({ institutionId });

    const isManagerAllowed =
      this.firebase.isManager(user) && institution.ownerId === user.uid;

    const isTrainerAllowed =
      this.firebase.isTrainer(user) &&
      institution.trainerIds.includes(user.uid);

    if (!isManagerAllowed && !isTrainerAllowed)
      throw new UnauthorizedException(
        'You do not have permission to edit training protocols',
      );
  }

  @LogMethod()
  async getProtocols(
    user: User,
    ref: InstitutionRef,
  ): Promise<TrainingProtocol[]> {
    const institution = await this.findByIdOrFail(ref);

    if (!this.canView(user, institution))
      throw new UnauthorizedException(
        'You do not have permission to view training protocols',
      );

    return await this.protocolRepository.getAllByInstitution(ref);
  }

  async getProtocol(
    user: User,
    ref: TrainingProtocolRef,
  ): Promise<TrainingProtocol> {
    const institution = await this.findByIdOrFail(ref);

    if (!this.canView(user, institution))
      throw new UnauthorizedException(
        'You do not have permission to view this training protocol',
      );

    return await this.protocolRepository.findById(ref);
  }

  async createTrainingProtocol(
    ref: InstitutionRef,
    input: TrainingProtocol,
  ): Promise<string> {
    const { institutionId } = ref;
    return await this.protocolRepository.save(
      { ...input, institutionId },
      { institutionId },
    );
  }

  async updateTrainingProtocol(
    ref: TrainingProtocolRef,
    input: Partial<TrainingProtocol>,
  ) {
    await this.protocolRepository.update(ref, input);
  }

  async deleteTrainingProtocol(ref: TrainingProtocolRef) {
    await this.protocolRepository.delete(ref);
  }

  @LogMethod()
  async update(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionDto,
  ): Promise<Institution> {
    const institution = await this.findByIdOrFail(ref);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    await this.repository.update(ref.institutionId, input);
    return { ...institution, ...this.commonService.object.clean(input) };
  }

  async findMembers(ref: InstitutionRef): Promise<Profile[]> {
    const institution = await this.findByIdOrFail(ref);
    return await this.profileService.findAllByInstitution(institution);
  }

  @LogMethod()
  async updateMember(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionMemberDto,
  ) {
    const { add, trainer } = input;

    const institution = await this.findByIdOrFail(ref);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    const member = await this.authService.findOneBy('id', input.userId);
    if (!member) throw new BadRequestException('Member does not exist');

    const memberRef: InstitutionMemberRef = {
      institutionId: institution.id,
      uid: member.uid,
    };

    if (trainer) {
      if (!this.firebase.isTrainer(member))
        throw new BadRequestException(
          'Member must be a trainer to be added as a trainer',
        );

      // updating trainer
      if (!add) await this.membersRepository.removeMember(memberRef);
      else
        await this.membersRepository.addMember(
          { role: UserRole.TRAINER },
          memberRef,
        );
    } else {
      // updating athlete
      const operations: BatchOperation<InstitutionMember>[] = add
        ? this.membersRepository.getAddMembersOperation(ref, [
            { id: member.uid, role: UserRole.ATHLETE },
          ])
        : this.membersRepository.getRemoveMembersOperation(ref, [member.uid]);

      // remove athlete in all groups & trainings
      if (!add)
        await this.eventEmitter.emitAsync(
          INSTITUTION_ATHLETE_EVENT,
          new UpdateInstitutionAthleteEvent({
            operations,
            institutionId: institution.id,
            userId: member.uid,
            add,
          }),
        );

      await this.firebase.paginateBatches(operations);
    }
  }

  async addMember(
    data: Pick<InstitutionMember, 'role'>,
    ref: InstitutionMemberRef,
  ) {
    await this.membersRepository.addMember(data, ref);
  }

  buildAddMembersOperation(
    ref: InstitutionRef,
    data: Create<Omit<InstitutionMember, 'institutionId'>>[],
  ): BatchWriteOperation<InstitutionMember>[] {
    return this.membersRepository.getAddMembersOperation(ref, data);
  }

  canView(user: User, institution: Institution) {
    // app admin
    if (this.firebase.isAdmin(user)) return true;

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
    if (this.firebase.isAdmin(user)) return true;

    // institution owner
    if (this.firebase.isManager(user) && institution.ownerId === user.uid)
      return true;

    return false;
  }
}
