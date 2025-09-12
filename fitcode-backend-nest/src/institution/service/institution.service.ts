import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import { InstitutionRef } from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { UserEntity } from '@src/user/entity/user.entity';
import { UserService } from '@src/user/service/user.service';

import { INSTITUTION_ATHLETE_EVENT } from '../constant/update-institution-athlete-event.constant';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { UpdateInstitutionMembersDto } from '../dto/update-institution-members.dto';
import { Institution } from '../entity/institution.entity';
import { GetMembersType } from '../enum/institution-get-members.enum';
import { UpdateInstitutionAthleteEvent } from '../event/update-institution-athlete.event';
import { InstitutionRepository } from '../repository/institution.repository';

@Injectable()
export class InstitutionService implements Permission<Institution> {
  private logger = new Logger(InstitutionService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
    private readonly repository: InstitutionRepository,
  ) {}

  async getDoc(ref: InstitutionRef): Promise<Institution | null> {
    return await this.repository.findById(ref.institutionId);
  }

  async getDocByOwner(ownerId: string): Promise<Institution | null> {
    return (
      await this.repository.findAll((q) => q.where('ownerId', '==', ownerId))
    )?.[0];
  }

  async getDocByIdOrFail(ref: InstitutionRef): Promise<Institution> {
    const institution = await this.getDoc(ref);
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async findAll(user: User): Promise<Institution[]> {
    return await this.repository.findAll((q) =>
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

    const id = await this.repository.save(query);
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

    await this.repository.update(ref.institutionId, input);
    return { ...institution, ...this.commonService.object.clean(input) };
  }

  async findMembers(
    ref: InstitutionRef,
    type: GetMembersType,
  ): Promise<UserEntity[]> {
    const institution = await this.getDocByIdOrFail(ref);
    const collection = this.userService.getCollection();

    const ids =
      type === GetMembersType.ATHLETES
        ? institution.athleteIds
        : type === GetMembersType.TRAINERS
          ? institution.trainerIds
          : [
              ...institution.athleteIds,
              ...institution.trainerIds,
              institution.ownerId,
            ];

    return this.firebaseService.batchIn('id', ids, collection);
  }

  @LogMethod()
  async updateMembers(
    user: User,
    ref: InstitutionRef,
    input: UpdateInstitutionMembersDto,
  ) {
    const { add, trainer } = input;

    const institution = await this.getDocByIdOrFail(ref);
    if (!this.canEdit(user, institution))
      throw new UnauthorizedException('You cannot edit this institution');

    const member = await this.userService.findOneBy('id', input.userId);
    if (!member) throw new BadRequestException('Member does not exist');

    if (trainer) {
      if (!this.firebaseService.isTrainer(member))
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

      // update athlete in all groups & trainings
      await this.eventEmitter.emitAsync(
        INSTITUTION_ATHLETE_EVENT,
        new UpdateInstitutionAthleteEvent({
          operations,
          institutionId: institution.id,
          userId: member.uid,
          add,
        }),
      );

      await this.firebaseService.paginateBatches(operations);
    }
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
