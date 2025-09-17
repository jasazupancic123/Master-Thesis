import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addMinutes, isAfter, isBefore, subMinutes } from 'date-fns';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
} from 'firebase-admin/firestore';

import { ChangeLogManager } from '@src/change-log/change-log.manager';
import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN } from '../constant/training-limits.constant';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';

@Injectable()
export class TrainingRepository extends FirestoreRepository<Training> {
  collectionName = FirestoreCollection.TRAINING;

  constructor(
    readonly firebaseService: FirebaseService,
    @Inject(Training)
    readonly changeLog: ChangeLogManager<Training>,
  ) {
    super(firebaseService);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<Training>): Promise<string> {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Training>(
      { ...input, id },
      { timestamps: true },
    );

    const ref = this.doc(id);
    this.changeLog.trackCreate(ref);
    await ref.set(query);

    return id;
  }

  async update(id: string, input: Update<Training>) {
    const query = this.firebaseService.buildUpdateQuery<Training>(input);
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update(query);
  }

  async delete(id: string) {
    const ref = this.doc(id);
    await this.changeLog.trackDelete(ref);
    await ref.delete();
  }

  async addMember(training: Training, memberId: string) {
    const { ref, data } = this.getUpdateMemberOperation(
      training,
      memberId,
      true,
    );

    await this.changeLog.trackUpdate(ref);
    await ref.update(data);
  }

  async removeMember(training: Training, memberId: string) {
    const { ref, data } = this.getUpdateMemberOperation(
      training,
      memberId,
      false,
    );

    await this.changeLog.trackUpdate(ref);
    await ref.update(data);
  }

  getUpdateMemberOperation(
    training: Training,
    memberId: string,
    add: boolean,
  ): BatchWriteOperation<Training> {
    return {
      ref: this.doc(training.id),
      operation: 'update',
      data: {
        ...(!add && {
          completedMembersIds: FieldValue.arrayRemove(
            memberId,
          ) as unknown as string[],
        }),
        membersIds: add
          ? (FieldValue.arrayUnion(memberId) as unknown as string[])
          : (FieldValue.arrayRemove(memberId) as unknown as string[]),
        components: training.components.map((tc) =>
          this.firebaseService.buildCreateQuery<TrainingComponent>({
            ...tc,
            ...(!add && {
              completedMembersIds: tc.completedMembersIds.filter(
                (id) => id !== memberId,
              ),
            }),
            subgroups: tc.subgroups.map((sg) =>
              !add && sg.membersIds.includes(memberId) // remove member from subgroup
                ? {
                    ...sg,
                    membersIds: sg.membersIds.filter((id) => id !== memberId),
                  }
                : sg,
            ),
          }),
        ),
      },
    };
  }

  async updateComponentTime(
    training: Training,
    componentId: string,
    input: DateRangeDto,
  ) {
    const duration = DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN;
    const query: Update<Training> = {
      warmup: { ...training.warmup },
      cooldown: { ...training.cooldown },
    };

    const all = [...training.components].sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );

    const i = all.findIndex((c) => c.id === componentId);
    if (i === -1) throw new NotFoundException('Component not found');

    const prev = all[i - 1];
    const next = all[i + 1];

    // update the component itself
    all[i].from = input.from;
    all[i].to = input.to;

    // check that input's to is not more than the next component's to
    if (next && isAfter(input.to, next.to))
      throw new BadRequestException(
        'Cannot extend time beyond the next component',
      );

    // same for from
    if (prev && isBefore(input.from, prev.from))
      throw new BadRequestException(
        'Cannot move start time before the previous component',
      );

    if (i === 0) {
      // first component → adjust warmup + next
      const trainingFrom = subMinutes(input.from, duration);
      query.from = trainingFrom;
      query.warmup.from = trainingFrom;
      query.warmup.to = input.from;

      if (next) next.from = input.to;
    } else if (i === all.length - 1) {
      // last component → adjust cooldown + prev
      const trainingTo = addMinutes(input.to, duration);
      query.to = trainingTo;
      query.cooldown.to = trainingTo;
      query.cooldown.from = input.to;

      if (prev) prev.to = input.from;
    } else {
      // middle → adjust only immediate neighbors
      if (prev) prev.to = input.from;
      if (next) next.from = input.to;
    }

    query.components = all;
    await this.update(training.id, query);
    return query;
  }

  async deleteComponent(training: Training, componentId: string) {
    // delete component and adjust times
    const duration = DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN;
    const query: Update<Training> = {
      from: training.from,
      to: training.to,
      warmup: { ...training.warmup },
      cooldown: { ...training.cooldown },
    };

    const all = [...training.components].sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );

    const i = all.findIndex((c) => c.id === componentId);
    if (i === -1) throw new NotFoundException('Component not found');

    const prev = all[i - 1];
    const next = all[i + 1];

    if (i === 0) {
      // first component → adjust warmup + next
      if (next) {
        const trainingFrom = subMinutes(next.from, duration);
        query.from = trainingFrom;
        query.warmup.from = trainingFrom;
        query.warmup.to = next.from;
      }
    } else if (i === all.length - 1) {
      // last component → adjust cooldown + prev
      if (prev) {
        const trainingTo = addMinutes(prev.to, duration);
        query.to = trainingTo;
        query.cooldown.to = trainingTo;
        query.cooldown.from = prev.to;
      }
    } else if (prev && next)
      // middle → adjust only immediate neighbors
      prev.to = next.from;

    query.components = all.filter((c) => c.id !== componentId);
    await this.update(training.id, query);
    return query;
  }
}
