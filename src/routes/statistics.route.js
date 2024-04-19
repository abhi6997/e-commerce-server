import { Router } from "express";

const router =Router();
import { getBarCharts, getPieCharts, getStatistics,getLineCharts } from "../controllers/statistics.controller.js";
import isAdmin from "../middlewares/auth.middleware.js";


router.route("/statistics").get(isAdmin,getStatistics);
router.route("/get-pie-charts").get(isAdmin,getPieCharts);
router.route("/get-bar-charts").get(isAdmin,getBarCharts);
router.route("/get-line-charts").get(isAdmin,getLineCharts);
export default router;