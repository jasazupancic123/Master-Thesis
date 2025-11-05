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
import { FirebaseModule } from './firebase/firebase.module';
import { GroupModule } from './group/group.module';
import { InstitutionModule } from './institution/institution.module';
import { ProfileModule } from './profile/profile.module';
import { TestDbModule } from './test-db/test-db.module';
import { TrainingModule } from './training/training.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    FirebaseModule.forRoot(),
    EventEmitterModule.forRoot(),
    CommonModule,
    CacheManagerModule,
    AuthModule,
    AttributeModule,
    ProfileModule,
    InstitutionModule,
    ExerciseModule,
    GroupModule,
    TrainingModule,
    ...(process.env.NODE_ENV === 'test' ? [TestDbModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
