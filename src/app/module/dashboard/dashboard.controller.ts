import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";

const getUserDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await DashboardService.getUserDashboardStats(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User dashboard stats fetched successfully!",
    data: result,
  });
});

export const DashboardController = {
  getUserDashboardStats,
};
