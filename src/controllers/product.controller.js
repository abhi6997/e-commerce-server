import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Product } from "../models/product.model.js";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/invalidateCache.js";

const registerProduct = asyncHandler(async (req, res, next) => {
  const { name, 
         price, 
         stock, 
         category } = req.body;

  const photo = req.file;
  if (!photo) {return res.status(400).json(new ApiError(400, "Please upload Photo"))};
  const photoLocalPath = photo.path;

  const uploadedPhoto = await uploadOnCloudinary(photoLocalPath);

  if (!uploadedPhoto){
    return res.status(400).json(new ApiError(400, "error while uploading file on cloudinary"));
  }
    

  if (!name || !price || !stock || !category)
   {
    return res.status(400).json(new ApiError(400, "please provide all fields"));
   }

  const registeredProduct = await Product.create({
    name,
    price,
    stock,
    category: category.toLowerCase(),
    photo: uploadedPhoto?.url,
  });

  invalidateCache({pro:true,adm:true})

  return res
    .status(200)
    .json({
      message: "Product registered successfully",
      success:true,
     
      
    }
      )
});

const getLatestProducts = asyncHandler(async (req, res, next) => {
  let latestProduct = [];
  if (myCache.has("latest-product")) {
    latestProduct = JSON.parse(myCache.get("latest-product"));
  } else {
    latestProduct = await Product.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      // {$limit:2}
    ]);

 
    myCache.set("latest-product", JSON.stringify(latestProduct));
  }

  if (!latestProduct) throw new ApiError(400, "products not found");
  return res
    .status(200)
    .json({
      message: "latest product fetched successfully",
      success:true,
      products : latestProduct
    }
      )
  })


const getAllCategories = asyncHandler(async (req, res, next) => {
  let AllCategories = [];
  if (myCache.has("all-categories")) {
    AllCategories = JSON.parse(myCache.get("all-categories"));
  } else {
    AllCategories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
        },
      },
    ]);

    myCache.set("all-categories", JSON.stringify(AllCategories));
  }

  const categoryArray = AllCategories.map((i) => {
    console.log(i._id);
    return i._id;
  });

  return res
    .status(200)
    .json({
      message: "All categories fetched successfully",
      success:true,
      categoryArray
    }
      )
});

const getAdminProducts = asyncHandler(async (req, res, next) => {
  let products;
  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products"));
  else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  return res
    .status(200)
    .json({
      message: "All admin products fetched successfully",
      success:true,
      products
    }
      )
});

const getSingleProduct = asyncHandler(async (req, res, next) => {

  // when we click on any product then product-details will emerge
  let product =[]
  const id = req.params.id;  //productId
  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`));
  else {
    product = await Product.findById(id);
    if (!product){

      return res
    .status(200)
    .json(
      new ApiError(404,"Product Not Found")
      )

    } 

    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res
    .status(200)
    .json({
      message: "product fetched successfully",
      success:true,
      product
    }
      )
});

const updateProduct = asyncHandler(async (req, res, next) => {
  const  id  = req.params.productId;

  const { name, price, stock, category } = req.body;
  console.log(name,price,stock,category)
  const photo = req.file;
 
  if (!photo) throw new ApiError(400, "Please upload Photo");
  const photoLocalPath = photo.path;
  
  
  const uploadedPhoto = await uploadOnCloudinary(photoLocalPath);
  console.log("tu chutiyaaaa hai")
  console.log(uploadedPhoto)
  if (!uploadedPhoto)
    throw new ApiError(400, "error while uploading file on cloudinary");

  if (!name || !price || !stock || !category)
    throw new ApiError(400, "Please enter all fields");

  const product = await Product.findByIdAndUpdate(id, {
    name,
    price,
    stock,
    category,
    photo: uploadedPhoto.url
  });

  if (!product) {
    throw new ApiError(400, "Invalid product Id");
  }
  invalidateCache({
    pro: true,
    productId: String(id),
    adm: true,
  });

  return res
    .status(200)
    .json({
      message: "Product Updated Successfully",
      success:true,
      product
    }
      )
});

const deleteProduct = asyncHandler(async (req, res, next) => {
  const {id} = req.params
  
  
  await Product.findByIdAndDelete(id);

  invalidateCache({
    pro: true,
    productId: String(id),
    adm: true,
  });
  return res
    .status(200)
    .json({
      message: "Product deleted successfully",
      success:true,
     
    }
      )
});

const getSearchedProduct = asyncHandler(async (req, res, next) => {
  const { search, sort, category, price } = req.query;
  const page = Number(req.query.page) || 1;

  if (!page) throw new ApiError(400, "bhai frontend se page toh bhej");

  const limit = Number(process.env.PRODUCT_PER_PAGE) || 4;
  const skip = (page - 1) * limit;

  const matchStage = {};

  if (search) {
    matchStage.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (price) {
    matchStage.price = {
      $lte: Number(price),
    };
  }

  if (category && category !== "All") {
    matchStage.category = category;
  }

  const pipeline = [];

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({
      $match: matchStage,
    });
  }

  if (sort) {
    const sortStage = {
      $sort: {
        price: sort === "asc" ? 1 : -1,
      },
    };
    pipeline.push(sortStage);
  }

  pipeline.push({
    $skip: skip,
  });

  pipeline.push({
    $limit: limit,
  });
  const promise1 = Product.countDocuments(matchStage);
  const promise2 = Product.aggregate(pipeline);
  
  const [totalProducts,products ] = await Promise.all([promise1, promise2]);
  // const products = await Product.aggregate(pipeline);
  // const totalProducts = await Product.countDocuments(matchStage);

  const totalPages = Math.ceil(totalProducts / limit);
 
  return res
    .status(200)
    .json({
      message: "Searched Products fetched successfully",
      success:true,
      products,
      totalPages
    }
      )
});

export {
  registerProduct,
  getLatestProducts,
  getAllCategories,
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getSearchedProduct,
};
