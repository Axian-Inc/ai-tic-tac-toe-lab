import type { ErrorCode } from "./contracts.js";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (code: ErrorCode, message: string): ApiError =>
  new ApiError(400, code, message);

export const notFound = (message = "Resource not found"): ApiError =>
  new ApiError(404, "GAME_NOT_FOUND", message);
