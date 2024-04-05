import { Router } from "express";

const router =Router();
import { getBarCharts, getPieCharts, getStatistics,getLineCharts } from "../controllers/statistics.controller.js";


router.route("/statistics").get(getStatistics);
router.route("/get-pie-charts").get(getPieCharts);
router.route("/get-bar-charts").get(getBarCharts);
router.route("/get-line-charts").get(getLineCharts);
export default router;