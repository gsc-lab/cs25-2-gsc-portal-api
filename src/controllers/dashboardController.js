import * as dashboardService from "../service/dashboard-service.js";

export async function getDashboardData(req, res, next) {
  try {
    console.log(req.user);

    const dashboardData = await dashboardService.getDashboardData(req.user);
    res.status(200).json(dashboardData);
  } catch (error) {
    next(error);
  }
}
