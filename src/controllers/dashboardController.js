import * as dashboardService from "../service/dashboard-service.js";

export async function getDashboardData(req, res, next) {
  try {
    const user = req.user;
    const targetDate = req.query.date;

    const dashboardData = await dashboardService.getDashboardData(
      user,
      targetDate,
    );
    res.status(200).json(dashboardData);
  } catch (error) {
    next(error);
  }
}
