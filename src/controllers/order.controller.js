import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { invalidateCache } from "../utils/invalidateCache.js";
import stockReducer from "../utils/stockReducer.js";
import { Order } from "../models/order.model.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";

const newOrder = asyncHandler(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    user,
    subTotal,
    tax,
    shippingCharges,
    discount,
    total,
  } = req.body;
  console.log(shippingInfo,
    orderItems,
    user,
    subTotal,
    tax,
    shippingCharges,
    discount,
    total,)

  console.log("new order data received")

 

  if (!shippingInfo || !orderItems || !user || !subTotal || !tax || !total) {
   
    return res
    .status(400)
    .json(new ApiError(400, "Please Enter All Fields"));
   
  }

  const order = await Order.create({
    shippingInfo,
    orderItems,
    user,
    subTotal,
    tax,
    shippingCharges,
    discount,
    total,
  });
  await stockReducer(orderItems);
  invalidateCache({ 
    pro: true, 
    ord: true, 
    adm: true,
    userId:user,
    productId:order.orderItems.map((i)=> String(i.productId))

});

  return res
    .status(200)
    .json({
      success:true,
      message:"Order placed successfully",
      
    });
});

const myOrders = asyncHandler(async (req, res, next) => {
  const  id  = req.params.id;   //user id

  const key = `my-orders-${id}`;

  let orders = [];

  if (myCache.has(key)) {
    
    orders = JSON.parse(myCache.get(key));
  } else {
    orders = await Order.find({user:id}).populate("user","name")
   
    myCache.set(key, JSON.stringify(orders));
  }

  return res
    .status(200)
    .json({
      success:true,
      message:"my order list fetched successfully",
    orders
    });
});

 const allOrders = asyncHandler(async (req, res, next) => {
  const key = `all-orders`;

  let orders = [];

  if (myCache.has(key))
  {orders = JSON.parse(myCache.get(key))}
  else {
    orders = await Order.find().populate("user","name");
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    message:"All orders fetched successgfully",
    orders,
  });
});

 const getSingleOrder = asyncHandler(async (req, res, next) => {
  const  id  = req.params.id; //orderId
  const key = `order-${id}`;

  let order;

  if (myCache.has(key)) {
    order = JSON.parse(myCache.get(key));
  } else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) {
      return res
      .status(200)
      .json(new ApiError(404,"order details not found"))
} 

    myCache.set(key, JSON.stringify(order));
  }
  return res
    .status(200)
    .json({
      success:true,
      message:"Order details fetched successfully",
      order
    });
});

const processOrder = asyncHandler(async (req, res, next) => {
    const { id } = req.params; //orderId
  
    const order = await Order.findById(id);
  
    if (!order){
      return res
    .status(404)
    .json( new ApiError(404,"Order Not Found"))

    }
  
    switch (order.status) {
      case "Processing":
        order.status = "Shipped";
        break;
      case "Shipped":
        order.status = "Delivered";
        break;
      default:
        order.status = "Delivered";
        break;
    }
  
    await order.save();
    invalidateCache({
        prod: false,
        ord: true,
        adm: true,
        userId: order.user,
        orderId: String(id),
      });
    return res
    .status(200)
    .json({
      success:true,
      message:"Order processed successfully",
      order
    });
  });

 const deleteOrder = asyncHandler(async (req, res, next) => {
    const {id} = req.params; //orderId
  
    const order = await Order.findById(id);
    
    if (!order){
      return res
    .status(404)
    .json( new ApiError(404,"Order Not Found"))

    }

    

    if (order.status === "Processing" || "Shipped"){
       const orderedProducts = order.orderItems;

       for(let i = 0;i<orderedProducts.length;i++){
        const product = await Product.findById(orderedProducts[i].productId)
        product.stock += orderedProducts[i].quantity
        await product.save();
       }
    }
    if (order.status === "Delivered"){
      return res
    .status(404)
    .json( new ApiError(404,"Order is already delivered"))
    }
  
    await order.deleteOne();
  
    invalidateCache({
      pro: true,
      ord: true,
      adm: true,
      userId: order.user,
      orderId: String(id),
      productId:order.orderItems.map((i)=> String(i.productId))
    });
  
    return res
    .status(200)
    .json({
      success:true,
      message:"Order Deleted successfully",
      order
    });
  });
  

export { newOrder, myOrders,allOrders,getSingleOrder, processOrder,deleteOrder };
