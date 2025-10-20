import { app } from '@/core/app.service';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainerDayViewCtxExtended } from '@/store/trainer-day-view.provider';

export function deselectAthlete(ctx: TrainerDayViewCtxExtended) {
  const {
    component,
    selectedAthlete,
    setSelectedSubgroup,
    setSelectedAthlete,
  } = ctx;

  const virtual = app.training.subgroup.getVirtual(
    selectedAthlete!.uid,
    component
  );

  if (virtual) {
    const parentSubgroup = app.training.subgroup.getParent(virtual, component);
    setSelectedSubgroup(parentSubgroup);

    // delete virtual subgroup if prescription is the same as parent
    if (app.training.subgroup.isEqual(virtual, component)) {
      const updated: TrainingComponent = structuredClone({
        ...component,
        subgroups: component.subgroups.filter((s) => s.id !== virtual.id),
      });

      ctx.setComponent(updated);
      ctx.setTraining((prev) => ({
        ...prev!,
        components: prev!.components.map((c) =>
          c.id === updated.id ? updated : c
        ),
      }));
    }
  }

  setSelectedAthlete(undefined);
}
