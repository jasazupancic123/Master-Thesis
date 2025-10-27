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
import { InstitutionRef } from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Profile } from '@src/profile/entity/profile.entity';
import { ProfileService } from '@src/profile/service/profile.service';

import { INSTITUTION_ATHLETE_EVENT } from '../constant/update-institution-athlete-event.constant';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { UpdateInstitutionMembersDto } from '../dto/update-institution-members.dto';
import { Institution } from '../entity/institution.entity';
import { UpdateInstitutionAthleteEvent } from '../event/update-institution-athlete.event';
import { InstitutionRepository } from '../repository/institution.repository';

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
        return await this.repository.findAllByTrainer(user.uid);
      case UserRole.ATHLETE:
        return await this.repository.findAllByAthlete(user.uid);
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

    const data: Create<Institution> = {
      id: null,
      ownerId: input.ownerId,
      athleteIds: [],
      trainerIds: [],
      name: input.name,
      imageUrl: input.imageUrl,
    };

    const query = this.firebase.buildCreateQuery(data, {
      timestamps: true,
    });

    const id = await this.repository.save(query);
    return { ...data, id, createdAt: new Date(), updatedAt: new Date() };
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
  async updateMembers(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionMembersDto,
  ) {
    const { add, trainer } = input;

    const institution = await this.findByIdOrFail(ref);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    const member = await this.authService.findOneBy('id', input.userId);
    if (!member) throw new BadRequestException('Member does not exist');

    if (trainer) {
      if (!this.firebase.isTrainer(member))
        throw new BadRequestException(
          'Member must be a trainer to be added as a trainer',
        );

      // updating trainer
      if (add) await this.repository.addTrainer(institution.id, member.uid);
      else await this.repository.removeTrainer(institution.id, member.uid);
    } else {
      // updating athlete
      const operations: BatchWriteOperation<
        { athleteIds: string[] } | { membersIds: string[] }
      >[] = [
        // update athlete in institution
        this.repository.getUpdateAthleteOperation(
          institution.id,
          member.uid,
          add,
        ),
      ];

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

  buildAddAthleteOperation(
    institutionId: string,
    athleteId: string,
  ): BatchWriteOperation<Institution> {
    return this.repository.getUpdateAthleteOperation(
      institutionId,
      athleteId,
      true,
    );
  }

  buildAddTrainerOperation(
    institutionId: string,
    trainerId: string,
  ): BatchWriteOperation<Institution> {
    return this.repository.getUpdateTrainerOperation(
      institutionId,
      trainerId,
      true,
    );
  }

  addTrainer(institutionId: string, trainerId: string) {
    return this.repository.addTrainer(institutionId, trainerId);
  }

  addAthlete(institutionId: string, athleteId: string) {
    return this.repository.addAthlete(institutionId, athleteId);
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
