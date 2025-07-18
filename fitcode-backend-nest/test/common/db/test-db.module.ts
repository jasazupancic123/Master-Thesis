import { Module } from '@nestjs/common';
import { TestExerciseService } from './service/test-exercise.service';
import { TestTrainingService } from './service/test-training.service';
import { TestWorkloadService } from './service/test-workload.service';
import { TestDbService } from './test-db.service';
import { FirebaseModule } from '@src/firebase/firebase.module';

@Module({
  imports: [FirebaseModule.forRoot()],
  providers: [
    TestDbService,
    TestTrainingService,
    TestWorkloadService,
    TestExerciseService,
  ],
  exports: [TestDbService],
})
export class TestDbModule {}
