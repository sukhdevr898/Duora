export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, 'bad_request', message, details);
  }
  static unauthorized(message = 'Not authorised') {
    return new ApiError(401, 'unauthorized', message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'forbidden', message);
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, 'not_found', message);
  }
  static conflict(message = 'Already exists', details?: unknown) {
    return new ApiError(409, 'conflict', message, details);
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, 'rate_limited', message);
  }
  static internal(message = 'Something went wrong') {
    return new ApiError(500, 'internal_error', message);
  }
}
