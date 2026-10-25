import { apiClient } from './apiClient';
import { ApiError } from './types';
import {
  AttendanceDocument,
  CheckInDTO,
  CheckOutDTO,
  AttendanceFilterParams,
  AttendanceListResponse,
} from '../types/attendance.types';

export const attendanceApi = {
  /**
   * List attendance records with server-level filters and pagination.
   * Strictly validates that count and data are returned.
   */
  listAttendance: async (
    filters?: AttendanceFilterParams
  ): Promise<AttendanceListResponse> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.branchId) params.branchId = filters.branchId;
    if (filters?.memberId) params.memberId = filters.memberId;
    if (filters?.date) params.date = filters.date;
    if (filters?.status) params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const response = await apiClient<AttendanceDocument[]>('/attendance', {
      method: 'GET',
      params,
    });

    if (
      typeof response.count !== 'number' ||
      !Number.isInteger(response.count) ||
      response.count < 0 ||
      !Array.isArray(response.data)
    ) {
      throw new ApiError(
        'Malformed response: Expected valid count and data array from attendance service.',
        500
      );
    }

    return {
      count: response.count,
      data: response.data,
    };
  },

  /**
   * Get single attendance record by ID.
   */
  getAttendanceById: async (
    attendanceId: string
  ): Promise<AttendanceDocument> => {
    const response = await apiClient<{ attendance: AttendanceDocument } | AttendanceDocument>(
      `/attendance/${attendanceId}`,
      {
        method: 'GET',
      }
    );

    const record =
      (response.data as any)?.attendance || (response.data as AttendanceDocument);

    if (!record || !record._id) {
      throw new ApiError(
        'Attendance record was not returned by the server.',
        500
      );
    }

    return record;
  },

  /**
   * Check in a member at a branch.
   */
  checkIn: async (dto: CheckInDTO): Promise<AttendanceDocument> => {
    const response = await apiClient<AttendanceDocument>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(dto),
    });

    if (!response.data) {
      throw new ApiError('Failed to record check-in.', 500);
    }

    return response.data;
  },

  /**
   * Check out an active open attendance session.
   */
  checkOut: async (dto: CheckOutDTO): Promise<AttendanceDocument> => {
    const response = await apiClient<AttendanceDocument>(
      '/attendance/check-out',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );

    if (!response.data) {
      throw new ApiError('Failed to record check-out.', 500);
    }

    return response.data;
  },

  /**
   * Permanently delete an attendance log from the database.
   */
  deleteAttendance: async (attendanceId: string): Promise<boolean> => {
    await apiClient(`/attendance/${attendanceId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
