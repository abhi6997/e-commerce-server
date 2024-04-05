import {Router} from "express";
const router = Router();
import  {registerUser, deleteUser, getAllUsers, getUser } from "../controllers/user.controller.js";
import isAdmin from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


router.route("/register").post( upload.single("photo"),registerUser)
router.route("/all").get(isAdmin, getAllUsers)
router.route("/:id").get(getUser).delete(isAdmin,deleteUser)


export default router;