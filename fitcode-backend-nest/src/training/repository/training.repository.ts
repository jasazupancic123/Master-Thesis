import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isAfter, isBefore } from 'date-fns';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
  Query,
  Timestamp,
} from 'firebase-admin/firestore';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { BatchWriteOperation, Filter } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';

@Injectable()
export class TrainingRepository extends FirestoreRepository<Training> {
  collectionName = FirestoreCollection.TRAINING;

  constructor(readonly firebase: FirebaseService) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  buildGetQuery(
    input: { uid: string; role: UserRole; institutionId: string },
    filter?: Filter<Training>,
    options?: { limit?: number },
  ): Query {
    let q = this.collection() as Query;

    switch (input.role) {
      case UserRole.ADMIN:
        break;
      case UserRole.MANAGER:
      case UserRole.TRAINER:
        if (input.institutionId)
          q = this.getQueryByInstitution(q, input.institutionId);
        else q = this.getQueryByMember(q, input.uid);
        break;
      case UserRole.ATHLETE:
        q = this.getQueryByMember(q, input.uid);
        break;
    }

    if (filter) q = this.filterQuery(q, filter);
    q = q.orderBy('from', 'asc');
    if (options?.limit) q = q.limit(options.limit);

    return q;
  }

  filterQuery(q: Query, filter: Filter<Training>): Query {
    if (filter.institutionId)
      q = q.where('institutionId', '==', filter.institutionId);

    if (filter.groupId) q = q.where('groupId', '==', filter.groupId);
    if (filter.cycleId) q = q.where('cycleId', '==', filter.cycleId);

    if (filter.from)
      q = q.where('from', '>=', Timestamp.fromDate(new Date(filter.from)));
    if (filter.to)
      q = q.where('to', '<=', Timestamp.fromDate(new Date(filter.to)));

    return q;
  }

  private getQueryByInstitution(q: Query, institutionId: string): Query {
    return q.where('institutionId', '==', institutionId);
  }

  private getQueryByMember(q: Query, memberId: string): Query {
    return q.where('membersIds', 'array-contains', memberId);
  }

  async save(input: Create<Training>): Promise<string> {
    const { id } = this.collection().doc();
    const query = this.firebase.buildCreateQuery<Training>(
      { ...input, id },
      { timestamps: true },
    );

    const ref = this.doc(id);
    await ref.set(query);

    return id;
  }

  async update(id: string, input: Update<Training>) {
    const query = this.firebase.buildUpdateQuery<Training>(input);
    const ref = this.doc(id);
    await ref.update(query);
  }

  async delete(id: string) {
    const ref = this.doc(id);
    await ref.delete();
  }

  async addMember(training: Training, memberId: string) {
    const { ref, data } = this.getUpdateMemberOperation(
      training,
      memberId,
      true,
    );

    await ref.update(data);
  }

  async removeMember(training: Training, memberId: string) {
    const { ref, data } = this.getUpdateMemberOperation(
      training,
      memberId,
      false,
    );

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
        membersIds: add
          ? (FieldValue.arrayUnion(memberId) as unknown as string[])
          : (FieldValue.arrayRemove(memberId) as unknown as string[]),
        components: training.components.map((tc) =>
          this.firebase.buildCreateQuery<TrainingComponent>({
            ...tc,
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
    const query: Update<Training> = {};
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
      // first component → adjust next
      query.from = input.from;
      if (next) next.from = input.to;
    } else if (i === all.length - 1) {
      // last component → adjust prev
      query.to = input.to;
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
    const query: Update<Training> = { from: training.from, to: training.to };
    const all = [...training.components].sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );

    const i = all.findIndex((c) => c.id === componentId);
    if (i === -1) throw new NotFoundException('Component not found');

    const prev = all[i - 1];
    const next = all[i + 1];

    if (i === 0) {
      // first component → adjust next
      if (next) query.from = next.from;
    } else if (i === all.length - 1) {
      // last component → adjust prev
      if (prev) query.to = prev.to;
    } else if (prev && next)
      // middle → adjust only immediate neighbors
      prev.to = next.from;

    query.components = all.filter((c) => c.id !== componentId);
    await this.update(training.id, query);
    return query;
  }
}
