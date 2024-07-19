import { Module } from '@nestjs/common';
import { ComponentService } from './component.service';
import { ComponentController } from './component.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  controllers: [ComponentController],
  providers: [ComponentService],
  imports: [FirebaseModule],
  exports: [ComponentService]
})
export class ComponentModule {}
