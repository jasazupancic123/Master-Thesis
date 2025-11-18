import { addMinutes, addSeconds } from 'date-fns';

import type { TrainingComponent } from '../type/training-component.type';
import { core } from '@/core/core.service';
import { Components } from '@/core/exercise/constant/components.constant';
import { Methods } from '@/core/exercise/constant/method.constant';
import { Targets } from '@/core/exercise/constant/target.constant';
import type { Component } from '@/core/exercise/type/component.type';
import type { Method } from '@/core/exercise/type/method.type';
import type { Target } from '@/core/exercise/type/target.type';
import type { Cycle } from '@/core/group/type/cycle.type';

export class TrainingComponentUtil {
  stub(id: string, data?: Partial<TrainingComponent>): TrainingComponent {
    return {
      id,
      from: data?.from || new Date(),
      to: data?.to || addMinutes(new Date(), 30),
      supersets: data?.supersets || [],
      subgroups: data?.subgroups || [],
      targetId: data?.targetId,
      periodizationType: data?.periodizationType,
      copiedFrom: data?.copiedFrom,
      location: data?.location,
    };
  }

  find(componentId: string): Component | undefined {
    return Components.find((c) => c.field === componentId);
  }

  findByTarget(targetId: string, componentId?: string): Component | undefined {
    const target = Targets.find((t) => t.field === targetId);
    if (!target) return undefined;
    if (componentId && target.componentId !== componentId) return undefined;
    return Components.find((c) => c.field === target.componentId);
  }

  findTarget(targetId?: string): Target | undefined {
    if (!targetId) return undefined;
    return Targets.find((t) => t.field === targetId);
  }

  findCycleTarget(targetId: string, cycle: Cycle): Target | undefined {
    const cycleTarget = cycle.targets.find((ct) => ct.targetId === targetId);
    if (!cycleTarget) return undefined;
    return Targets.find((t) => t.field === cycleTarget.targetId);
  }

  findMethodologies(componentId: string): Method[] {
    return Methods.filter((m) => m.componentId === componentId);
  }

  calculateEndDate(component: TrainingComponent): Date {
    const duration = component.supersets
      .flatMap((s) => s.exercises)
      .reduce((total, e) => {
        return total + (core.training.exercise.calculateDuration(e) || 0);
      }, 0);

    return addSeconds(new Date(component.from), duration);
  }
}
