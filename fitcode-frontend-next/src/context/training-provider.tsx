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
  userId: string | null;
  setUserId: (userId: string | null) => void;
  isLoaded: boolean;
}

const TrainingContext = createContext<TrainingContextType | undefined>(
  undefined
);

export const TrainingProvider = ({ children }: { children: ReactNode }) => {
  const STORED_TRAINING = 'fitcodeSelectedTraining';
  const STORED_COMPONENT = 'fitcodeSelectedComponent';
  const STORED_SUPERSET_INDEX = 'fitcodeSupersetIndex';
  const STORED_START_OF_TRAINING = 'fitcodeStartOfTraining';
  const STORED_USER_ID = 'fitcodeUserId';

  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );
  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [supersetIndex, setSupersetIndex] = useState<number | null>(null);
  const [view, setView] = useState<'exercises' | 'training'>('exercises');
  const [startOfTraining, setStartOfTraining] = useState<Dayjs | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const storedSelectedTraining = localStorage.getItem(STORED_TRAINING);
    const storedSelectedComponent = localStorage.getItem(STORED_COMPONENT);
    const storedSupersetIndex = localStorage.getItem(STORED_SUPERSET_INDEX);
    const storedStartOfTraining = localStorage.getItem(
      STORED_START_OF_TRAINING
    );
    const storedUserId = localStorage.getItem(STORED_USER_ID);

    if (storedSelectedTraining)
      setSelectedTraining(JSON.parse(storedSelectedTraining));
    if (storedSelectedComponent)
      setSelectedComponent(JSON.parse(storedSelectedComponent));
    if (storedSupersetIndex) setSupersetIndex(JSON.parse(storedSupersetIndex));
    if (storedStartOfTraining)
      setStartOfTraining(JSON.parse(storedStartOfTraining));
    if (storedUserId) setUserId(storedUserId);

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (
        !selectedTraining ||
        (userId && user?.uid && userId.replaceAll('\"', '') !== user?.uid)
      ) {
        clearTrainingState();
        return;
      }
      localStorage.setItem(STORED_TRAINING, JSON.stringify(selectedTraining));
      localStorage.setItem(STORED_COMPONENT, JSON.stringify(selectedComponent));
      localStorage.setItem(
        STORED_SUPERSET_INDEX,
        JSON.stringify(supersetIndex)
      );
      localStorage.setItem(
        STORED_START_OF_TRAINING,
        JSON.stringify(startOfTraining)
      );
      localStorage.setItem(STORED_USER_ID, JSON.stringify(user?.uid));
    }
  }, [selectedTraining, userId, supersetIndex, startOfTraining, isLoaded]);

  const clearTrainingState = () => {
    setSelectedTraining(null);
    setSelectedComponent(null);
    setSupersetIndex(null);
    setStartOfTraining(null);
    setView('exercises');
    localStorage.removeItem(STORED_TRAINING);
    localStorage.removeItem(STORED_COMPONENT);
    localStorage.removeItem(STORED_SUPERSET_INDEX);
    localStorage.removeItem(STORED_START_OF_TRAINING);
    localStorage.removeItem(STORED_USER_ID);
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
        userId,
        setUserId,
        setView,
        isLoaded,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => useContext(TrainingContext)!;
