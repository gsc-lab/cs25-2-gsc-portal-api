import * as cleaningService from "../service/cleaning-service.js";

export const generateCleaningRosters = async (req, res, next) => {
  try {
    const rosterInfo = req.body;

    const result = await cleaningService.generateRosters(rosterInfo);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in generateCleaningRosters controller:", error);
    next(error);
  }
};

export const getCleaningRosters = async (req, res, next) => {
  try {
    const date = req.query.date || new Date();
    let grade_id = req.query.grade_id;

    const rosterData = await cleaningService.findRosterWeek(date, grade_id);
    res.status(200).json(rosterData);
  } catch (error) {
    next(error);
  }
};

export const getMonthlyRoster = async (req, res, next) => {
  try {
    const data = await cleaningService.findRosterMonth();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
export const deleteRosterByGrade = async (req, res, next) => {
  try {
    const { section, grade_id } = req.query;

    if (!section) {
      return res.status(400).json({ message: "학기는 필수 파라미터입니다." });
    }

    const result = await cleaningService.removeRosters(section, grade_id);

    res.status(200).json({ result, message: "성곡적으로 삭제되었습니다." });
  } catch (error) {
    next(error);
  }
};
