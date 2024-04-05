import mongoose from "mongoose";
import { Product } from "../models/product.model.js";


const stockReducer = async (orderItems)=>{

   for(let i = 0; i <orderItems.length;i++){
        
    const order = orderItems[i];
    const product = await Product.findById(order.productId)

    product.stock -= order.quantity;
    await product.save();

   }

}

export default stockReducer;


