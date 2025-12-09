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
import { BatchOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { UserService } from '@src/user/service/user.service';
import { UserType } from '@src/user/type/user.type';

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
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllByInstitution(
    institution: Institution,
    skipFields: (keyof UserType)[] = [],
  ): Promise<UserType[]> {
    return await this.userService.findAllByInstitution(institution, skipFields);
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
      if (!add) await this.repository.removeMember(memberRef, UserRole.TRAINER);
      else
        await this.repository.addMember({ role: UserRole.TRAINER }, memberRef);
    } else {
      // updating athlete
      const operations: BatchOperation<InstitutionMember | Institution>[] = add
        ? this.repository.getAddMembersOperation(memberRef, [
            { id: member.uid, role: UserRole.ATHLETE },
          ])
        : this.repository.getRemoveMembersOperation(
            memberRef,
            [member.uid],
            UserRole.ATHLETE,
          );

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
  ): BatchOperation<InstitutionMember | Institution>[] {
    return this.repository.getAddMembersOperation(ref, data);
  }
}
