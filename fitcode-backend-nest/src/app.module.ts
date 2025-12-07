import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttributeModule } from './attribute/attribute.module';
import { AuthModule } from './auth/auth.module';
import { CacheManagerModule } from './cache-manager/cache-manager.module';
import { CommonModule } from './common/common.module';
import { validationSchema } from './config/environment-validation-schema';
import { ExerciseModule } from './exercise/exercise.module';
import { ExerciseAiPrescriptionsModule } from './exercise-ai-prescriptions/exercise-ai-prescriptions.module';
import { FirebaseModule } from './firebase/firebase.module';
import { InstitutionModule } from './institution/institution.module';
import { TestDbModule } from './test-db/test-db.module';
import { TrainingModule } from './training/training.module';
import { ProfileModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    FirebaseModule.forRoot(),
    EventEmitterModule.forRoot(),
    CommonModule,
    InstitutionModule,
    CacheManagerModule,
    AuthModule,
    AttributeModule,
    ProfileModule,
    ExerciseModule,
    TrainingModule,
    ExerciseAiPrescriptionsModule,
    ...(process.env.NODE_ENV === 'test' ? [TestDbModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
