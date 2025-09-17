import { forwardRef, Global, Module } from '@nestjs/common';

import { InstitutionModule } from '@src/institution/institution.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [forwardRef(() => InstitutionModule)],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
