'use client';

import { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import Circles from '@/components/circles';
import TrainingItem from '@/components/trainer-week-view/training-week-view-item';
import { useGroup } from '@/context/group-provider';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const commonService = CommonService.instance;

export default function TrainerWeekView() {
  const {
    token,
    components,
    cycle,
    filteredTrainings,
    training: selectedTraining,
    setTraining,
    setTrainings,
    setDateFrom,
    setDateTo,
  } = useGroup();

  const router = useRouter();
  const [index, setIndex] = useState(0); // week index
  const weeks = cycle?.weeks || [];

  /**
   * Set date to cycle start and end when opening the page
   */
  useEffect(() => {
    if (!cycle) return;
    setIndex(0);
  }, [cycle]);

  /**
   * Filter trainings based on cycle
   */
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(weeks[index][0].date));
    setDateTo(dayjs(weeks[index][6].date));
  }, [cycle, index]);

  if (!cycle) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#1A2B3C',
        padding: '12px',
        pb: '20px',
        borderRadius: '8px',
      }}
    >
      {/* Week selector */}
      <Box
        sx={{ padding: '0', backgroundColor: 'inherit', marginBottom: '20px' }}
      >
        <Circles
          arrows
          onArrowClick={(direction) => {
            if (
              (direction === 'left' && index === 0) ||
              (direction === 'right' && index === weeks.length - 1)
            )
              return;

            setIndex((prev) => (direction === 'left' ? prev - 1 : prev + 1));
          }}
          items={weeks.map((_: any, i: number) => ({
            label: `W${i + 1}`,
            value: i.toString(),
          }))}
          value={index.toString()}
          setValue={(value) => setIndex(parseInt(value))}
        />
      </Box>

      {/* Trainings */}
      <Box pt={4} px={1}>
        <Grid
          container
          spacing={2}
          display="flex"
          justifyContent="space-between"
        >
          {weeks[index].map(({ date }, i) => {
            const day = dayjs(date);
            const filtered = filteredTrainings.filter((t) =>
              commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to))
            );

            return (
              <Grid
                key={i}
                size={{ xs: 12 / 7 }}
                sx={{
                  padding: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography sx={{ color: '#fff' }}>
                  {commonService.date.format(day)}
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {filtered.map((training: any) => (
                    <Fragment key={training.id}>
                      <TrainingItem
                        training={training}
                        updateTraining={async (training, input) => {
                          if (!cycle) return;

                          await handleApiRequest(
                            router,
                            () =>
                              TrainingController.update(
                                token,
                                training.id,
                                input
                              ),
                            (training) => {
                              const mapped = TrainingService.mapComponents(
                                training,
                                components
                              );

                              if (training.id === selectedTraining?.id)
                                setTraining(mapped);

                              setTrainings((prev) =>
                                prev.map((t) =>
                                  t.id === training.id ? mapped : t
                                )
                              );

                              toast.success('Training updated successfully');
                            },
                            undefined,
                            'Error when updating training'
                          );
                        }}
                      />
                    </Fragment>
                  ))}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}
