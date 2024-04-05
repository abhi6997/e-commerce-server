import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const isAdmin = asyncHandler(async(req,res,next)=>{


    const {id} = req.query;
   
    if (!id){
        return res
        .status(400)
        .json(new ApiError(400,"Bhai Login karle"))
    } 
    const user = await User.findById(id);

    if(!user) throw new ApiError(400,"Bhai fake id mt de");
    if(user.role !== "admin") throw new ApiError(400,"Bhai tu admin nahi hai");

     next();

})

export default isAdmin;