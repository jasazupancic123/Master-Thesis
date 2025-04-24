'use client';

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
import { Dayjs } from 'dayjs';

interface TrainingContextType {
  clearTrainingState: () => void;
  selectedTraining: Training | null;
  setSelectedTraining: (training: Training | null) => void;
  selectedComponent: TrainingComponent | null;
  setSelectedComponent: (component: TrainingComponent | null) => void;
  supersetIndex: number | null;
  setSupersetIndex: (supersetIndex: number | null) => void;
  view: 'exercises' | 'training';
  setView: (view: 'exercises' | 'training') => void;
  startOfTraining: Dayjs | null;
  setStartOfTraining: (startOfTraining: Dayjs | null) => void;
  isLoaded: boolean;
}

const TrainingContext = createContext<TrainingContextType | undefined>(
  undefined
);

export const TrainingProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );
  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // To prevent SSR mismatches
  const [supersetIndex, setSupersetIndex] = useState<number | null>(null);
  const [view, setView] = useState<'exercises' | 'training'>('exercises');
  const [startOfTraining, setStartOfTraining] = useState<Dayjs | null>(null);

  const { user } = useAuth();

  // Load local storage data **AFTER** component mounts
  useEffect(() => {
    const storedSelectedTraining = localStorage.getItem('selectedTraining');
    const storedSelectedComponent = localStorage.getItem('selectedComponent');
    const storedSupersetIndex = localStorage.getItem('supersetIndex');
    const storedStartOfTraining = localStorage.getItem('startOfTraining');

    if (storedSelectedTraining)
      setSelectedTraining(JSON.parse(storedSelectedTraining));
    if (storedSelectedComponent)
      setSelectedComponent(JSON.parse(storedSelectedComponent));
    if (storedSupersetIndex) setSupersetIndex(JSON.parse(storedSupersetIndex));
    if (storedStartOfTraining)
      setStartOfTraining(JSON.parse(storedStartOfTraining));

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (!selectedTraining) {
        clearTrainingState();
        return;
      }
      localStorage.setItem(
        'selectedTraining',
        JSON.stringify(selectedTraining)
      );
      localStorage.setItem(
        'selectedComponent',
        JSON.stringify(selectedComponent)
      );
      localStorage.setItem('supersetIndex', JSON.stringify(supersetIndex));
      localStorage.setItem('startOfTraining', JSON.stringify(startOfTraining));
    }
  }, [selectedTraining, supersetIndex, startOfTraining, isLoaded]);

  const clearTrainingState = () => {
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
        clearTrainingState,
        selectedTraining,
        setSelectedTraining,
        selectedComponent,
        setSelectedComponent,
        supersetIndex,
        setSupersetIndex,
        view,
        startOfTraining,
        setStartOfTraining,
        setView,
        isLoaded,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => useContext(TrainingContext)!;
