import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Partial<{ pagination: PaginationMeta; [key: string]: unknown }>
) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      requestId: res.locals.requestId as string | undefined,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
    meta: {
      requestId: res.locals.requestId as string | undefined,
      timestamp: new Date().toISOString(),
    },
  });
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
