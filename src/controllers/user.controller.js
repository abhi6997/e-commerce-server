import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { invalidateCache } from "../utils/invalidateCache.js";

const registerUser = asyncHandler(async (req, res, next) => {
  const { _id, name, photo, email, gender, dob } = req.body;

  let registeredUser = await User.findById(_id);

  if (registeredUser) {
    return res
      .status(200)
      .json(
        {
          success:true,
          message : `Welcome! ${registeredUser.name}, You are already a user`
        }
      );
  }


 

  if (
    [_id, name, email, gender, dob].some(
      (field) => field === undefined || field.trim() === ""
    )
  ) {
    return res.status(400).json(new ApiError(400, "please enter all fields"));
  }

 
  const user = await User.create({
    _id,
    name,
    photo,
    email,
    gender,
    dob: new Date(dob),
  });

  invalidateCache({ adm: true });

  return res.status(201).json(
    {
      success:true,
      message : `Welcome! ${user.name}`
    }
  );
});

const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({});

  return res.status(200).json({
    success: true,
    message: "All users fetched successfully",
    users,
  });
});

const getUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) {
   return res
   .status(400)
   .json(
    new ApiError(400,"You are not registered,Please Sign-In")
   )
   }

  return res.status(200).json({
    success: true,
    message: "user details fetched successfully",
    user,
  });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) throw new ApiError(400, "User not found");

  await user.deleteOne();
  invalidateCache({ adm: true });
  return res.status(200).json({
    success: true,
    message: "user deleted successfully",
    user,
  });
});

export { registerUser, getAllUsers, getUser, deleteUser };
