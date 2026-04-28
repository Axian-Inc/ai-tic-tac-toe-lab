import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import type { ErrorCode } from "./contracts.js";
import { ApiError } from "./errors.js";

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
  "content-type": "application/json",
};

export const jsonResponse = (
  statusCode: number,
  body: unknown,
): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

export const errorResponse = (
  statusCode: number,
  code: ErrorCode,
  message: string,
): APIGatewayProxyStructuredResultV2 =>
  jsonResponse(statusCode, {
    error: {
      code,
      message,
    },
  });

export const routeNotFound = (): APIGatewayProxyStructuredResultV2 =>
  errorResponse(404, "NOT_FOUND", "Route not found.");

export const handleError = (error: unknown): APIGatewayProxyStructuredResultV2 => {
  if (error instanceof ApiError) {
    return errorResponse(error.statusCode, error.code, error.message);
  }

  console.error(error);
  return errorResponse(500, "INTERNAL_ERROR", "Internal server error.");
};

export const parseJsonBody = (body: string | undefined): unknown => {
  if (body === undefined || body.length === 0) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "Request body must be valid JSON.");
  }
};

export const getStringProperty = (body: unknown, key: string): unknown =>
  typeof body === "object" && body !== null ? (body as Record<string, unknown>)[key] : undefined;
