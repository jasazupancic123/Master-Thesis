'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { endOfDay, isBefore } from 'date-fns';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { TrainingController } from '@/core/training/training.controller';
import type { Training } from '@/core/training/type/training.type';
import type { GroupTrainingReportItem } from '@/core/training/type/training-report.type';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

type AttendanceData = Record<string, GroupTrainingReportItem>;

type Props = {
  selectedComponentId?: string;
};

const cache = new Map<string, AttendanceData>();

export default function GroupTrainingReportChart({
  selectedComponentId,
}: Props) {
  const { trainings } = useMain();
  const { selectedGroups } = useDashboard();

  const members = lib.common.generic.getUnique(
    selectedGroups.flatMap((g) => g.members || []),
    'uid'
  );

  const [data, setData] = useState<
    (GroupTrainingReportItem & {
      name: string;
      attendance: number;
      prescribed: number;
    })[]
  >([]);

  useEffect(() => {
    if (selectedGroups.length !== 1) return;

    const group = selectedGroups[0];

    if (!group) return;

    const key = selectedComponentId
      ? `${group.id}_${selectedComponentId}`
      : group.id;

    const updateData = (attendanceData: AttendanceData) => {
      setData(
        members.map((m) => {
          const filterByUser = (t: Training) => t.membersIds.includes(m.uid);
          const filterByDate = (t: Training) =>
            isBefore(t.from, endOfDay(new Date()));

          const attended = attendanceData[m.uid]?.attended || 0;
          const prescribed = trainings.data.filter((t) =>
            selectedComponentId
              ? filterByUser(t) &&
                filterByDate(t) &&
                t.components.some((c) => c.id === selectedComponentId)
              : filterByUser(t) && filterByDate(t)
          ).length;

          const attendance =
            prescribed > 0 ? Math.round((attended / prescribed) * 100) : 0;

          return {
            attended,
            realization: lib.common.number.roundToDecimal(
              (attendanceData[m.uid]?.realization || 0) * 100,
              2
            ),
            name: m.displayName || m.email || m.uid,
            prescribed,
            attendance,
          };
        })
      );
    };

    if (cache.has(key)) {
      updateData(cache.get(key)!);
      return;
    }

    const fetchAttendance = async () => {
      const attendance = await TrainingController.getInstance().getGroupReport(
        group.institutionId,
        group.id,
        selectedComponentId
      );

      // save to global cache
      cache.set(key, attendance);
      updateData(attendance);
    };

    fetchAttendance();
  }, [selectedGroups, selectedComponentId]);

  return (
    <BarChart
      dataset={data}
      xAxis={[{ scaleType: 'band', dataKey: 'name', label: '' }]}
      series={[
        {
          dataKey: 'attendance',
          label: 'Total Attendance (%)',
          color: '#1976d2',
        },
        {
          dataKey: 'realization',
          label: 'Total Realization (%)',
          color: '#9c27b0',
        },
      ]}
      yAxis={[
        { label: '', valueFormatter: (v: number) => `${v}%`, min: 0, max: 100 },
      ]}
      width={650}
      height={350}
      margin={{ top: 40, bottom: 60, left: 60, right: 20 }}
    />
  );
}
