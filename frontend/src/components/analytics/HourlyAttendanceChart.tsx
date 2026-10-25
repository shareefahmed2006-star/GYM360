import React from 'react';

interface HourlyAttendanceChartProps {
  distribution: number[]; // Exactly 24 elements (0..23)
  peakHourCount: number;
}

export const HourlyAttendanceChart: React.FC<HourlyAttendanceChartProps> = ({
  distribution,
  peakHourCount,
}) => {
  // Ensure we safely have 24 hours
  const safeData = Array.isArray(distribution) && distribution.length === 24
    ? distribution
    : Array(24).fill(0);

  const maxVal = Math.max(...safeData, 1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>Hourly Flow (00:00 - 23:00 UTC)</span>
        <span className="font-semibold text-gym-700">Peak: {peakHourCount} check-ins</span>
      </div>

      <div className="h-36 w-full flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 border-b border-gray-100">
        {safeData.map((count, hour) => {
          const heightPercent = (count / maxVal) * 100;
          const isPeak = count === peakHourCount && count > 0;

          return (
            <div
              key={hour}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip */}
              <div className="absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xs">
                {String(hour).padStart(2, '0')}:00 — {count} check-ins
              </div>

              {/* Bar */}
              <div
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
                className={`w-full rounded-t transition-all ${
                  isPeak
                    ? 'bg-gym-600 group-hover:bg-gym-700'
                    : count > 0
                    ? 'bg-gym-200 group-hover:bg-gym-400'
                    : 'bg-gray-100'
                }`}
                role="graphics-symbol"
                aria-label={`Hour ${hour}:00, ${count} check-ins`}
              />
            </div>
          );
        })}
      </div>

      {/* Hour labels (sampled for readability) */}
      <div className="flex justify-between text-[10px] text-gray-400 pt-1.5 font-mono">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
};
