import { Router } from "express";
const router = Router();
import  isAdmin  from "../middlewares/auth.middleware.js";
import {
  getLatestProducts,
  registerProduct,
  getAllCategories,
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getSearchedProduct
  
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

router.route("/new").post( isAdmin,upload.single("photo"), registerProduct);
// router.route("/all").post(isAdmin, getAllProducts);
router.route("/latest").get( getLatestProducts);
router.route("/categories").get( getAllCategories);
router.route("/admin-products").get( isAdmin ,getAdminProducts);
router.route("/all").get(getSearchedProduct)

router
  .route("/:id")
  .get(getSingleProduct)
  .delete(isAdmin, deleteProduct);

router.route("/:productId").put( upload.single("photo"), isAdmin,updateProduct)

export default router;
