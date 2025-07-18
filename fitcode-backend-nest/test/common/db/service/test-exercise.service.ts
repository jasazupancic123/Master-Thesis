import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create } from '@src/common/type/entity.type';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { FirebaseService } from '@src/firebase/firebase.service';

@Injectable()
export class TestExerciseService {
  constructor(private readonly firebase: FirebaseService) {}

  async create(
    input: Partial<Create<Exercise>> & {
      ownerId: string;
      componentIds: string[];
    },
  ): Promise<Exercise> {
    const data = generateExerciseStub(input);
    const query = this.firebase.buildCreateQuery<Exercise>(data, {
      timestamps: true,
    });

    await this.firebase.firestore
      .collection(FirestoreCollection.EXERCISE)
      .add(query)
      .then((docRef) => this.firebase.serialize(docRef));

    return this.firebase.serialize(query);
  }

  async clear() {
    const collectionRef = this.firebase.firestore.collection(
      FirestoreCollection.EXERCISE,
    );

    await this.firebase.firestore.recursiveDelete(collectionRef);
  }

  async delete(id: string): Promise<void> {
    const docRef = this.firebase.firestore.doc(
      `${FirestoreCollection.EXERCISE}/${id}`,
    );

    await docRef.delete();
  }
}
