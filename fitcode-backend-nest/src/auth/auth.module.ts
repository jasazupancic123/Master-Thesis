import { forwardRef, Global, Module } from '@nestjs/common';

import { InstitutionModule } from '@src/institution/institution.module';
import { ProfileModule } from '@src/profile/profile.module';

import { AuthController } from './auth.controller';
import { AuthService } from './service/auth.service';

@Global()
@Module({
  imports: [
    forwardRef(() => InstitutionModule),
    forwardRef(() => ProfileModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
