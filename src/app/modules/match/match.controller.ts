import { Request, Response, NextFunction } from "express";
import catchAsync from "../../shared/catchAsync";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../shared/sendResponse";
import { matchService } from "./match.service";
import { createMatchSchema, updateMatchStatusSchema } from "./match.validation";

/**
 * POST /matches
 * body: { recipientId }
 * user (req.user) must be set by auth middleware (userId present)
 */
export const createMatch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

 
  const created = await matchService.createMatch(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Match created successfully",
    data: created,
  });
});

/**
 * PATCH /matches/:id/status
 * body: { status }
 */
export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const matchId = req.params.id;

  const updated = await matchService.updateMatchStatus(matchId, userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Match status updated",
    data: updated,
  });
});

/**
 * GET /matches
 * returns all matches
 */
export const getAllMatches = catchAsync(async (req: Request, res: Response) => {
  const matches = await matchService.getAllMatches(req.query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Matches fetched successfully",
    data: matches.data,
    meta: matches.meta,
  });
});


const getSingleMatch = catchAsync(async (req: Request, res: Response) => {
  const data = await matchService.  getSingleMatch(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Match fetched", data });
});

/**
 * GET /matches/me
 * returns matches for logged-in user
 */
export const getMyMatches = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const matches = await matchService.getMyMatches(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Your matches fetched successfully",
    data: matches,
  });
});

/**
 * DELETE /matches/:id
 */
export const deleteMatch = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const matchId = req.params.id;
  await matchService.deleteMatch(matchId, userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Match deleted successfully",
    data:null,
  });
});


export const matchController = {
  createMatch,
  updateStatus,
  getAllMatches,
  getMyMatches,
  deleteMatch,
  getSingleMatch,
};