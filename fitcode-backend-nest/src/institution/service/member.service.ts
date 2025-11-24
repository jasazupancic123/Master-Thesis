import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthService } from '@src/auth/service/auth.service';
import { Create } from '@src/common/type/entity.type';
import {
  InstitutionMemberRef,
  InstitutionRef,
} from '@src/common/type/firestore.type';
import { BatchOperation, BatchWriteOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { ProfileService } from '@src/profile/service/profile.service';
import { AuthProfileMerged } from '@src/profile/type/auth-profile-merged.type';

import { INSTITUTION_ATHLETE_EVENT } from '../constant/update-institution-athlete-event.constant';
import { UpdateInstitutionMemberDto } from '../dto/update-institution-members.dto';
import { Institution } from '../entity/institution.entity';
import { InstitutionMember } from '../entity/institution-member.entity';
import { UpdateInstitutionAthleteEvent } from '../event/update-institution-athlete.event';
import { InstitutionMembersRepository } from '../repository/institution-members.repository';

@Injectable()
export class MemberService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly repository: InstitutionMembersRepository,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: Wrapper<ProfileService>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllByInstitution(
    institution: Institution,
  ): Promise<AuthProfileMerged[]> {
    return await this.profileService.findAllByInstitution(institution);
  }

  async addOrRemove(
    institution: Institution,
    input: UpdateInstitutionMemberDto,
  ) {
    const { add, trainer } = input;
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
      if (!add) await this.repository.removeMember(memberRef);
      else
        await this.repository.addMember({ role: UserRole.TRAINER }, memberRef);
    } else {
      // updating athlete
      const operations: BatchOperation<InstitutionMember>[] = add
        ? this.repository.getAddMembersOperation(memberRef, [
            { id: member.uid, role: UserRole.ATHLETE },
          ])
        : this.repository.getRemoveMembersOperation(memberRef, [member.uid]);

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
  buildAddMembersOperation(
    ref: InstitutionRef,
    data: Create<Omit<InstitutionMember, 'institutionId'>>[],
  ): BatchWriteOperation<InstitutionMember>[] {
    return this.repository.getAddMembersOperation(ref, data);
  }
}
