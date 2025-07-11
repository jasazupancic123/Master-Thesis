import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Exercise } from '../entity/exercise.entity';
import { CommonService } from '../../common/service/common.service';

@Injectable()
export class ExerciseRepository
  implements RootFirestoreCollectionRepository<Exercise>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Exercise[]> {
    const snapshot = await query(this.collection())
      // .where('deletedAt', '==', null)
      .get();

    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Exercise>),
    );
  }

  async getDoc(exerciseId: string): Promise<Exercise> {
    const snapshot = await this.doc(exerciseId).get();
    if (!snapshot.exists) return null;
    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Exercise>,
    );
  }

  async addDoc(input: Create<Omit<Exercise, 'attributeValues'>>) {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Exercise>(
      {
        id,
        ownerId: input.ownerId,
        name: input.name,
        componentIds: input.componentIds,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        instruction: input.instruction || '',
        attributeValues: undefined,
      },
      { timestamps: true },
    );

    await this.doc(id).set(query);
    return id;
  }

  async updateDoc(exerciseId: string, input: Update<Exercise>) {
    const data = this.firebaseService.buildUpdateQuery(input);
    await this.doc(exerciseId).update(data);
  }

  async deleteDoc(exerciseId: string) {
    // soft delete
    const query = this.firebaseService.buildUpdateQuery<Exercise>({
      deletedAt: new Date(),
    });

    await this.doc(exerciseId).update(query);
  }

  doc(exerciseId: string): DocumentReference {
    return this.collection().doc(exerciseId);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.EXERCISE,
    );
  }

  async slug(name: string): Promise<string> {
    const slug = this.commonService.string.slug(name);
    const snapshot = await this.getDoc(slug);

    if (snapshot) {
      // slug already exists, add number to the end
      const lastNumberMatch = slug.match(/\d+$/);
      const number = lastNumberMatch ? +lastNumberMatch[0] : 0;
      return `${slug}-${number + 1}`;
    }

    return slug;
  }
}
