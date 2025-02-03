import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './service/user.service';
import { UserRepository } from './repository/user.repository';
import { UserMetaRepository } from './repository/user-meta.repository';
import { TrainingModule } from 'src/training/training.module';

@Module({
  imports: [TrainingModule],
  controllers: [UserController],
  providers: [UserMetaRepository, UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
