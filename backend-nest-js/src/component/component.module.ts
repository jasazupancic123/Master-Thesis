import { Module } from '@nestjs/common';
import { ComponentService } from './component.service';
import { ComponentController } from './component.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { Component } from './entity/component.entity';

@Module({
  // @ts-ignore
  imports: [FirebaseModule.forFeature([Component])],
  controllers: [ComponentController],
  providers: [ComponentService],
  exports: [ComponentService],
})
export class ComponentModule {
}
