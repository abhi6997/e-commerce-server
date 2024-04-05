import { Router } from "express";
const router = Router();
import  isAdmin  from "../middlewares/auth.middleware.js";
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controllers/payment.controller.js";

router.route("/create").post(createPaymentIntent)
router.route("/new").post(newCoupon);
router.route("/discount").get(applyDiscount)
router.route("/all").get(allCoupons);
router.route("/delete-coupon/:id").delete(deleteCoupon);




export default router;
