import React from 'react';
import { AttendanceAnalyticsResponse } from '../../types/analytics.types';
import { HourlyAttendanceChart } from './HourlyAttendanceChart';
import {
  CalendarCheck,
  Users,
  Activity,
  Gauge,
  Calendar,
  Clock,
  Info,
} from 'lucide-react';

interface AttendanceFlowSectionProps {
  data: AttendanceAnalyticsResponse;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedBranchName?: string;
}

export const AttendanceFlowSection: React.FC<AttendanceFlowSectionProps> = ({
  data,
  selectedDate,
  onDateChange,
  selectedBranchName,
}) => {
  const {
    totalCheckIns,
    uniqueMembers,
    currentlyCheckedIn,
    hourlyDistribution,
    peakHourCheckIns,
    flowUtilizationPercent,
  } = data;

  const todayUtc = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === todayUtc;

  return (
    <div className="space-y-6">
      {/* 1. Header & Date Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Facility Occupancy & Hourly Flow (UTC Timeline)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Turnstile check-ins, unique daily visitors, and facility capacity utilization.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="bg-transparent border-0 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
            />
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => onDateChange(todayUtc)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              Reset to Today
            </button>
          )}
        </div>
      </div>

      {/* 2. Core Metrics: Check-Ins vs Unique Visitors vs Live Occupancy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric A: Total Check-In Events */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Total Check-Ins</span>
            <CalendarCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900 font-mono">
            {totalCheckIns}
          </div>
          <p className="text-[11px] text-gray-400">
            Total check-in scans recorded on {selectedDate}
          </p>
        </div>

        {/* Metric B: Unique Visitors */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Unique Members</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900 font-mono">
            {uniqueMembers}
          </div>
          <p className="text-[11px] text-gray-400">
            Distinct individuals who visited on this date
          </p>
        </div>

        {/* Metric C: Live Checked-In Occupancy */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Currently In Facility</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {currentlyCheckedIn}
          </div>
          <p className="text-[11px] text-gray-400">
            Open sessions with pending check-out
          </p>
        </div>

        {/* Metric D: Capacity Utilization */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Peak Hour Load</span>
            <Gauge className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            {flowUtilizationPercent !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-gray-900 font-mono">
                  {flowUtilizationPercent.toFixed(1)}%
                </span>
                <span className="text-xs text-gym-700 font-semibold font-mono">
                  ({peakHourCheckIns} peak)
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                {selectedBranchName ? 'Capacity not set for branch' : 'Requires branch selection'}
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            Peak check-in hour load relative to capacity
          </p>
        </div>
      </div>

      {/* 3. 24-Hour Timeline Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>24-Hour Check-In Timeline (UTC)</span>
          </div>
          <span className="text-[11px] text-gray-400">
            Peak volume: <strong className="text-gray-700 font-mono">{peakHourCheckIns}</strong> check-ins/hr
          </span>
        </div>

        <HourlyAttendanceChart
          distribution={hourlyDistribution}
          peakHourCount={peakHourCheckIns}
        />

        <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-1">
          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>
            Check-ins are timestamped and aggregated according to UTC hours (00:00 to 23:00).
          </span>
        </div>
      </div>
    </div>
  );
};
