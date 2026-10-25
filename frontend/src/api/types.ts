export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Unable to connect to the GYM360 server. Please check your internet connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}
