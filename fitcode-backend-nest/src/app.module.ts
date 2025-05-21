import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/environment-validation-schema';
import { UserModule } from './user/user.module';
import { FirebaseMiddleware } from './firebase/firebase.middleware';
import { ComponentModule } from './component/component.module';
import { ExerciseModule } from './exercise/exercise.module';
import { GroupModule } from './group/group.module';
import { TrainingModule } from './training/training.module';
import { CommonModule } from './common/common.module';
import { CacheManagerModule } from './cache-manager/cache-manager.module';
import { AttributeModule } from './attribute/attribute.module';
import { InstitutionModule } from './institution/institution.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    FirebaseModule.forRoot(),
    CommonModule,
    CacheManagerModule,
    AttributeModule,
    UserModule,
    ComponentModule,
    ExerciseModule,
    GroupModule,
    TrainingModule,
    InstitutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FirebaseMiddleware)
      .exclude('/', '/component', '/attribute')
      .forRoutes('*');
  }
}
