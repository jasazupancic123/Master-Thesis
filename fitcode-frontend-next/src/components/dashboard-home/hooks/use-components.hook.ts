import { Group } from '@/core/institution/type/group.type';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { Training } from '@/core/training/type/training.type';
import { useMain } from '@/store/main.provider';
import { useState, useEffect } from 'react';

export default function useDashboardHomeComponents(
  selectedGroups: Group[],
  trainings: Training[]
) {
  const { activeTraining } = useMain();

  const [selectedTrainingComponent, setSelectedTrainingComponent] =
    useState<TrainingComponent | null>(null);

  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );

  const [componentItems, setComponentItems] = useState<
    {
      id: string;
      percentage: number; // in %
      value: number;
    }[]
  >([]);

  const activeComponent = activeTraining
    ? activeTraining.components.find((c) => {
        const status = activeTraining.statuses.find(
          (s) => s.componentId === c.id
        )?.status;

        if (!status) return false;

        return [TrainingStatus.IN_PROGRESS, TrainingStatus.PAUSED].includes(
          status
        );
      })
    : null;

  useEffect(() => {
    const componentIdCounter: { id: string; count: number }[] = [];

    trainings
      .filter((training) =>
        selectedGroups.some((group) => group.id === training.groupId)
      )
      .forEach((training) => {
        training.components.forEach((component) => {
          const existingComponent = componentIdCounter.find(
            (item) => item.id === component.id
          );
          if (existingComponent) {
            existingComponent.count += 1;
          } else {
            componentIdCounter.push({ id: component.id, count: 1 });
          }
        });
      });

    const totalCount = componentIdCounter.reduce(
      (acc, item) => acc + item.count,
      0
    );
    const componentItems = componentIdCounter
      .map((item) => ({
        id: item.id,
        percentage:
          totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
        value: item.count,
      }))
      .sort((a, b) => b.value - a.value);

    setComponentItems(componentItems);
  }, [selectedGroups, trainings]);

  return {
    selectedTrainingComponent,
    setSelectedTrainingComponent,
    selectedTraining,
    setSelectedTraining,
    componentItems,
    activeComponent,
  };
}
