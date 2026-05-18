import { Response } from 'express';

export const ok = (
  res: Response,
  message: string,
  data: object | null = null
) => res.status(200).json({
  Success: true,
  Message: message,
  Object: data,
  Errors: null,
});

export const created = (
  res: Response,
  message: string,
  data: object | null = null
) => res.status(201).json({
  Success: true,
  Message: message,
  Object: data,
  Errors: null,
});

export const paginated = (
  res: Response,
  message: string,
  data: object[],
  page: number,
  size: number,
  total: number
) => res.status(200).json({
  Success: true,
  Message: message,
  Object: data,
  PageNumber: page,
  PageSize: size,
  TotalSize: total,
  Errors: null,
});

export const fail = (
  res: Response,
  status: number,
  message: string,
  errors: string[] | null = null
) => res.status(status).json({
  Success: false,
  Message: message,
  Object: null,
  Errors: errors,
});