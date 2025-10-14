import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

interface UseTrainingCycleComponentsProps {
  training: Training;
  trainingComponent?: TrainingComponent;
  componentCalendarView?: boolean;
  periodizationView?: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
}

export default function useTrainingCycleComponents(
  props: UseTrainingCycleComponentsProps
) {
  const {
    training,
    trainingComponent,
    componentCalendarView,
    periodizationView,
    containerRef,
  } = props;

  const [isWrapped, setIsWrapped] = useState(false);

  const [components, setComponents] = useState<TrainingComponent[]>(
    (componentCalendarView || periodizationView) &&
      trainingComponent &&
      trainingComponent.component
      ? (training.components
          .map((c) => {
            if (
              c.component &&
              c.component.id === trainingComponent.component!.id
            )
              return c;
            else return null;
          })
          .filter((c) => c !== null) as TrainingComponent[])
      : training.components
  );

  useEffect(() => {
    if (
      (componentCalendarView || periodizationView) &&
      trainingComponent &&
      trainingComponent.component
    ) {
      const newComponents = training.components
        .map((c) => {
          if (c.component && c.component.id === trainingComponent.component!.id)
            return c;
          else return null;
        })
        .filter((c) => c !== null) as TrainingComponent[];

      setComponents(newComponents);
    } else {
      setComponents(training.components);
    }
  }, []);

  useEffect(() => {
    const checkWrapping = () => {
      if (!containerRef.current) return;

      const children = Array.from(containerRef.current.children);
      if (children.length < 2) {
        setIsWrapped(false);
        return;
      }

      // Check if any element is positioned below the first one
      const firstRowTop = (children[0] as HTMLElement).offsetTop;
      const isMultiRow = children.some(
        (child) => (child as HTMLElement).offsetTop > firstRowTop
      );

      setIsWrapped(isMultiRow);
    };

    // Initial check & event listener for resizes

    setComponents(
      (componentCalendarView || periodizationView) &&
        trainingComponent &&
        trainingComponent.component
        ? (training.components
            .map((c) => {
              if (
                c.component &&
                c.component.id === trainingComponent.component!.id
              )
                return c;
              else return null;
            })
            .filter((c) => c !== null) as TrainingComponent[])
        : training.components
    );

    checkWrapping();

    window.addEventListener('resize', checkWrapping);

    return () => window.removeEventListener('resize', checkWrapping);
  }, [training.components, components.length]);

  return {
    isWrapped,
    components,
  };
}
