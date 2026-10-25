import { AppError } from '../middleware/errorHandler';

/**
 * Returns today's calendar date in UTC as a YYYY-MM-DD string.
 */
export const getTodayUtcDateString = (): string => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Pure UTC calendar-date arithmetic.
 * endDate = startDate + durationDays.
 * Does not use millisecond multiplication (durationDays * 86400000) to avoid DST or leap shifts.
 */
export const calculateEndDateUtc = (startDateStr: string, durationDays: number): string => {
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new AppError('Invalid startDate format. Expected YYYY-MM-DD.', 400);
  }

  const [year, month, day] = parts;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new AppError('Invalid calendar date in startDate.', 400);
  }

  // Construct UTC date (month is 0-indexed in JS Date)
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + durationDays);

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Determines whether a membership is currently valid on a given UTC date:
 * startDate <= currentDate < endDate AND status === "active"
 */
export const isMembershipValidUtc = (
  startDate: string,
  endDate: string,
  status: string,
  currentDate: string = getTodayUtcDateString()
): boolean => {
  if (status !== 'active') return false;
  return startDate <= currentDate && currentDate < endDate;
};

/**
 * Validates strictly whether an input is a valid ISO-8601 timestamp.
 * Rejects non-strings, arbitrary formats, and invalid date representations.
 */
export const isValidIsoTimestamp = (str: unknown): str is string => {
  if (typeof str !== 'string' || !str.trim()) return false;
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
  if (!isoRegex.test(str)) return false;
  const timestamp = Date.parse(str);
  return !isNaN(timestamp);
};

/**
 * Validates strictly whether an input is a valid UTC calendar date YYYY-MM-DD.
 */
export const isValidUtcDateString = (str: unknown): str is string => {
  if (typeof str !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(str)) return false;
  const parts = str.split('-').map(Number);
  const [y, m, d] = parts;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return (
    dateObj.getUTCFullYear() === y &&
    dateObj.getUTCMonth() + 1 === m &&
    dateObj.getUTCDate() === d
  );
};

/**
 * Validates strictly whether an input is a valid 24-hour time string HH:mm.
 */
export const isValidTimeString = (str: unknown): str is string => {
  if (typeof str !== 'string') return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(str);
};

/**
 * Resolves the day of the week ('Monday' ... 'Sunday') from a valid UTC calendar date YYYY-MM-DD.
 */
export const getDayOfWeekFromUtcDate = (dateStr: string): string => {
  const parts = dateStr.split('-').map(Number);
  const [y, m, d] = parts;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dateObj.getUTCDay()];
};


