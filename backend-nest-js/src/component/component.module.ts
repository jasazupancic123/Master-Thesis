import { Module } from '@nestjs/common';
import { ComponentService } from './component.service';
import { ComponentController } from './component.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [ComponentController],
  providers: [ComponentService],
  exports: [ComponentService]
})
export class ComponentModule {}
