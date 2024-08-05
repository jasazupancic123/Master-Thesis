'use client';

import MyModal from '@/component/modal';
import { InputLabel } from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import React, { useState } from 'react';
import { useFetch } from '@/hook/use-fetch';
import { Exercise } from '@/type/exercise.type';
import { CreateSet } from '@/type/training.type';

interface TrainingModalProps {
  data: { trainingId: string };
  setData: (data: { trainingId: string }) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
}

export default function TrainingModal(props: TrainingModalProps) {
  const {
    data,
    setData,
    isOpen,
    setIsOpen,
    title,
  } = props;

  const [exercises, loading, error] = useFetch<Exercise[]>('/exercise')
  const [exercise, setExercise] = useState<Exercise>(null)

  async function createSet(item: CreateSet) {}

  return <MyModal
    isOpen={isOpen}
    setIsOpen={setIsOpen}
    width={500}
    title={title}
    onCancel={() => setIsOpen(false)}
    onConfirm={() => createSet({
      trainingId: data.trainingId,
      exercises: [{
        exerciseId: exercise.id,
        order: 0,
        sets: 3,
        reps: 12,
        kg: 0,
        tempo: 0,
        intensity: 0,
        rec: 0,
        work: 0,
      }],
      color: 'red',
      order: 0,
    })}
  >
    <InputLabel id="component">Exercises</InputLabel>
    <Select
      labelId='exercises'
      label='Exercises'
      variant='outlined'
      fullWidth
      value={exercise?.id || ''}
      onChange={(e) => setExercise(exercises.find((exercise) => exercise.id === e.target.value))}
    >
      <MenuItem value={''}>None</MenuItem>

      {loading
        ? <MenuItem disabled>Loading...</MenuItem>
        : error
          ? <MenuItem disabled>Error loading exercises</MenuItem>
          : exercises.map((exercise) => (
            <MenuItem key={exercise.id} value={exercise.id}>
              {exercise.name}
            </MenuItem>
          ))}
    </Select>
  </MyModal>
}