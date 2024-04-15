import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Coupon } from "../models/coupon.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { stripe } from "../app.js";


const createPaymentIntent = asyncHandler(async(req,res,next)=>{
   const {amount,shippingInfo,name} = req.body;
   console.log(shippingInfo)
   if(!amount ){
    return res
    .status(400)
    .json(new ApiError(400,"Please Enter Amount"))

   }  
   if(!shippingInfo ){
    return res
    .status(400)
    .json(new ApiError(400,"Please Provide Shipping details"))

   } 
   if(!name ){
    return res
    .status(400)
    .json(new ApiError(400,"Please provide user details"))

   } 
   const paymentIntent = await stripe.paymentIntents.create({
    description:"E-commerce services",
    shipping:{
      name,
      address:{
        line1:shippingInfo.address,
        postal_code:shippingInfo.pinCode,
        city: shippingInfo.city,
        state:shippingInfo.state,
        country:shippingInfo.country
      }
    },
  amount:Number(amount)*100, //amount is in paise
  currency:"inr",
  payment_method_types:["card"]

})


return res
.status(201)
.json({
  success:true,
  message: "paymnet link created successfully",
  clientSecret: paymentIntent.client_secret
})


})
const newCoupon = asyncHandler(async (req, res, next) => {
    const { couponCode, amount } = req.body;
  
    if (!couponCode || !amount)throw new ApiError(400,"Please enter both couponCode and amount" );
  
    const coupon = await Coupon.create({ couponCode , amount });
  
    return res
    .status(201)
    .json({
      message:"Coupon created successfully",
      success:true,
      coupon
    });
  });

  const applyDiscount = asyncHandler(async (req, res, next) => {
    const { couponCode } = req.query;
  
    const validCoupon = await Coupon.findOne({couponCode});
     
   
   
    if (!validCoupon){
      return res
      .status(400)
      .json(new ApiError(400,"Invalid Coupon Code"))
      
  } 

    const discountAmount = validCoupon.amount 
    
    return res
    .status(200)
    .json({
      message:"discount details fetched successfully",
      success:true,
      discountAmount
    });
  });

const allCoupons = asyncHandler(async (req, res, next) => {
    const coupons = await Coupon.find({});
  
    return res
    .status(200)
    .json({
      message:"All Coupons fetched successfully",
      success:true,
      coupons
    });
  });
  
 const deleteCoupon = asyncHandler (async (req, res, next) => {
    const { id } = req.params;
  
    const coupon = await Coupon.findByIdAndDelete(id);
  
    if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));
  
    return res
    .status(200)
    .json({
      message:`Coupon ${coupon.code} Deleted Successfully`,
      success:true,
      coupon
    });
  });

  export {newCoupon, applyDiscount,allCoupons,deleteCoupon,createPaymentIntent}