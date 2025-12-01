/** biome-ignore-all lint/style/useImportType: <elanation> */
import { type Response } from "express";

const sendResponse = <T>(
  res: Response,
  jsonData: {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null | undefined;
    meta?: {
      page: number;
      limit: number;
      total: number;
    };
  }
) => {
  res.status(jsonData.statusCode).json({
    success: jsonData.success,
    message: jsonData.message,
    meta: jsonData.meta || null || undefined,
    data: jsonData.data || null || undefined,
  });
};

export default sendResponse;
