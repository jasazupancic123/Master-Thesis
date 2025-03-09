import { Module } from '@nestjs/common';
import { AttributeRepository } from './repository/attribute.repository';
import { AttributeService } from './service/attribute.service';
import { ParamRepository } from './repository/param.repository';
import { ParamService } from './service/param.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  providers: [
    AttributeRepository,
    ParamRepository,
    AttributeService,
    ParamService,
  ],
  exports: [AttributeService, ParamService],
})
export class AttributeModule {}
