'use client';

import { TrainingResult } from '@/components/athlete-trainings/training-in-progress';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './auth-provider';

interface TrainingContextType {
  trainingResult: TrainingResult | null;
  setTrainingResult: (state: TrainingResult) => void;
  clearTrainingState: () => void;
  selectedTraining: Training | null;
  setSelectedTraining: (training: Training | null) => void;
  selectedComponent: TrainingComponent | null;
  setSelectedComponent: (component: TrainingComponent | null) => void;
  supersetIndex: number | null;
  setSupersetIndex: (supersetIndex: number | null) => void;
  view: 'exercises' | 'training';
  setView: (view: 'exercises' | 'training') => void;
  isLoaded: boolean;
}

const TrainingContext = createContext<TrainingContextType | undefined>(
  undefined
);

export const TrainingProvider = ({ children }: { children: ReactNode }) => {
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(
    null
  );
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );
  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // To prevent SSR mismatches
  const [supersetIndex, setSupersetIndex] = useState<number | null>(null);
  const [view, setView] = useState<'exercises' | 'training'>('exercises');

  const { user } = useAuth();

  // Load local storage data **AFTER** component mounts
  useEffect(() => {
    const storedTraining = localStorage.getItem('trainingState');
    const storedSelectedTraining = localStorage.getItem('selectedTraining');
    const storedSelectedComponent = localStorage.getItem('selectedComponent');
    const storedSupersetIndex = localStorage.getItem('supersetIndex');

    if (storedTraining) setTrainingResult(JSON.parse(storedTraining));
    if (storedSelectedTraining)
      setSelectedTraining(JSON.parse(storedSelectedTraining));
    if (storedSelectedComponent)
      setSelectedComponent(JSON.parse(storedSelectedComponent));
    if (storedSupersetIndex) setSupersetIndex(JSON.parse(storedSupersetIndex));

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (
        trainingResult?.userId &&
        user?.uid &&
        trainingResult.userId !== user?.uid
      ) {
        clearTrainingState();
        return;
      }
      localStorage.setItem('trainingState', JSON.stringify(trainingResult));
      localStorage.setItem(
        'selectedTraining',
        JSON.stringify(selectedTraining)
      );
      localStorage.setItem(
        'selectedComponent',
        JSON.stringify(selectedComponent)
      );
      localStorage.setItem('supersetIndex', JSON.stringify(supersetIndex));
    }
  }, [trainingResult, supersetIndex, isLoaded]);

  const clearTrainingState = () => {
    setTrainingResult(null);
    setSelectedTraining(null);
    setSelectedComponent(null);
    setSupersetIndex(null);
    setView('exercises');
    localStorage.removeItem('trainingState');
    localStorage.removeItem('selectedTraining');
    localStorage.removeItem('selectedComponent');
    localStorage.removeItem('supersetIndex');
    localStorage.removeItem('userId');
  };

  return (
    <TrainingContext.Provider
      value={{
        trainingResult,
        setTrainingResult,
        clearTrainingState,
        selectedTraining,
        setSelectedTraining,
        selectedComponent,
        setSelectedComponent,
        supersetIndex,
        setSupersetIndex,
        view,
        setView,
        isLoaded,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => useContext(TrainingContext)!;
