'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { TrainingController } from '@/core/training/training.controller';
import { useDashboard } from '@/store/dashboard.provider';

type AttendanceData = Record<string, number>;

type Props = {
  groupId?: string;
  selectedUserId?: string;
  selectedComponentId?: string;
};

export default function GroupAttendanceChart({
  groupId,
  selectedUserId,
  selectedComponentId,
}: Props) {
  const { selectedInstitution, trainings } = useDashboard();

  const group = selectedInstitution?.groups?.find((g) => g.id === groupId);
  const members = selectedUserId
    ? (group?.members || []).filter((m) => m.uid === selectedUserId)
    : group?.members || [];

  const [cache, setCache] = useState<Record<string, AttendanceData>>({});
  const [data, setData] = useState<
    { name: string; attendance: number; attended: number; prescribed: number }[]
  >([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!group) return;

      const cacheKey = selectedComponentId
        ? `${group.id}_${selectedComponentId}`
        : group.id;

      if (cache[cacheKey]) {
        const attendance = cache[cacheKey];
        updateData(attendance);
        return;
      }

      const attendance =
        await TrainingController.getInstance().getGroupAttendance(
          group.id,
          selectedComponentId
        );

      setCache((prev) => ({ ...prev, [cacheKey]: attendance }));
      updateData(attendance);
    };

    const updateData = (attendanceData: AttendanceData) => {
      setData(
        members.map((m) => {
          const attended = attendanceData[m.uid] || 0;
          const prescribed = trainings.filter((t) =>
            selectedComponentId
              ? t.membersIds.includes(m.uid) &&
                t.components.some((c) => c.id === selectedComponentId)
              : t.membersIds.includes(m.uid)
          ).length;

          const attendance =
            prescribed > 0 ? Math.round((attended / prescribed) * 100) : 0;

          return {
            name: m.displayName || m.email || m.uid,
            attended,
            prescribed,
            attendance,
          };
        })
      );
    };

    fetchAttendance();
  }, [group, selectedComponentId, selectedUserId]);

  return (
    <BarChart
      dataset={data}
      xAxis={[{ scaleType: 'band', dataKey: 'name', label: 'Athletes' }]}
      series={[
        { dataKey: 'attendance', label: 'Attendance (%)', color: '#1976d2' },
      ]}
      yAxis={[
        {
          label: 'Attendance %',
          valueFormatter: (v: number) => `${v}%`,
          min: 0,
          max: 100,
        },
      ]}
      width={650}
      height={350}
      margin={{ top: 40, bottom: 60, left: 60, right: 20 }}
    />
  );
}
