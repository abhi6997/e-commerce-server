import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from "../controllers/order.controller.js";

import isAdmin from "../middlewares/auth.middleware.js";

import { Router } from "express";
const router = Router();




router.route("/new").post(newOrder);
router.route("/my-orders/:id").get(myOrders)
router.route("/all").get(isAdmin,allOrders)
router.route("/specific-order/:id").get(getSingleOrder);
router.route("/process-order/:id").put(isAdmin,processOrder)
router.route("/delete-order/:id").delete(deleteOrder)

export default router;


