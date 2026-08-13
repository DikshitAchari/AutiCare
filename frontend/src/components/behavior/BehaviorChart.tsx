import React from 'react';
import type { BehaviorLog } from '../../types/behavior';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { Activity } from 'lucide-react';

export interface BehaviorChartProps {
  logs: BehaviorLog[];
}

export const BehaviorChart: React.FC<BehaviorChartProps> = ({ logs }) => {
  const chartData = logs.map((log) => {
    const freq = log.frequencyCount ?? log.frequency ?? 1;
    const sevVal =
      log.intensityLevel === 'HIGH' || log.severity === 'SEVERE'
        ? 3
        : log.intensityLevel === 'MODERATE' || log.severity === 'MODERATE'
        ? 2
        : 1;

    return {
      date: log.date,
      frequency: freq,
      severity: sevVal,
      title: log.behaviorDescription || log.behaviorTitle || 'Observation'
    };
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Behavior Frequency & Intensity Trend
          </h4>
          <p className="text-xs text-slate-500">Track recorded behaviors over time</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="frequency" name="Occurrences" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="severity" name="Severity Index (1-3)" stroke="#e11d48" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
