import { asyncHandler } from "../utils/asyncHandler.js";
import { percentageCalculator } from "../utils/percentageCalculator.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import aggregateCalculator from "../utils/aggregateCalculator.js";
import { myCache } from "../app.js";
import { getChart } from "../utils/getChart.js";
import { getMonthlyCountArray } from "../utils/getMonthlyCountArray.js";

const getStatistics = asyncHandler(async (req, res, next) => {
  let statistics = {};
  const key = "admin-statistics";

  if (myCache.has(key)) {
    statistics = JSON.parse(myCache.get(key));
  } else {
    const today = new Date();
    const dateBeforeSixMonthAgo = new Date();
    dateBeforeSixMonthAgo.setMonth(today.getMonth() - 6);

    if (dateBeforeSixMonthAgo.getMonth() > today.getMonth()) {
      dateBeforeSixMonthAgo.setFullYear(today.getFullYear() - 1);
    }

    console.log(dateBeforeSixMonthAgo.toDateString());

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: dateBeforeSixMonthAgo,
        $lte: today,
      },
    });

    const latestTransactionsPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const allOrdersPromise = Order.find({}).select(["total"]);
    const totalProductsPromise = Product.countDocuments();
    const totalUsersPromise = User.countDocuments();
    const AllCategoriesPromise = Product.distinct("category");
    const femaleUsersPromise = User.countDocuments({ gender: "female" });

    const [
      thisMonthProducts,
      lastMonthProducts,
      thisMonthUsers,
      lastMonthUsers,
      thisMonthOrders,
      lastMonthOrders,
      lastSixMonthOrders,
      latestTransactions,
      allOrders,
      AllCategories,
      totalProducts,
      totalUsers,
      totalFemaleCount,
    ] = await Promise.all([
      thisMonthProductsPromise,
      lastMonthProductsPromise,
      thisMonthUsersPromise,
      lastMonthUsersPromise,
      thisMonthOrdersPromise,
      lastMonthOrdersPromise,
      lastSixMonthOrdersPromise,
      latestTransactionsPromise,
      allOrdersPromise,
      AllCategoriesPromise,
      totalProductsPromise,
      totalUsersPromise,
      femaleUsersPromise,
    ]);

    const thisMonthRevenue = aggregateCalculator(thisMonthOrders);
    const lastMonthRevenue = aggregateCalculator(lastMonthOrders);
    const totalRevenue = aggregateCalculator(allOrders);

    const userRatio = {
      male: totalUsers - totalFemaleCount,
      female: totalFemaleCount,
    };

    const modifiedLatestTransactions = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    const relativeChanges = {
      relativeChangeInProduct: percentageCalculator(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      relativeChangeInUsers: percentageCalculator(
        thisMonthUsers.length,
        lastMonthUsers.length
      ),
      relativeChangeInOrders: percentageCalculator(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
      relativeChangeInRevenue: percentageCalculator(
        thisMonthRevenue,
        lastMonthRevenue
      ),
    };

    const totalCount = {
      AllCategories,
      totalProducts,
      totalUsers,
      totalRevenue,
      totalFemaleCount,
    };


    const [monthlyOrdersCount,monthlyRevenueCount] = getChart({length:6,todaysDate:today,docArray:lastSixMonthOrders});
    

    const EachCategoryCountArrayPromise = AllCategories.map((category) =>
      Product.countDocuments({ category })
    );

    const EachCategoryCountArray = await Promise.all(
      EachCategoryCountArrayPromise
    );

    const EachCategoryPercentage = AllCategories.map((category, i) => ({
      [category]: Math.round((EachCategoryCountArray[i] / totalProducts) * 100),
    }));

    statistics = {
      relativeChanges,
      totalCount,
      userRatio,
      latestTransactions: modifiedLatestTransactions,
      EachCategoryPercentage,
      chart: {
        monthlyOrdersCount,
        monthlyRevenueCount,
      },
    };
    myCache.set(key, JSON.stringify(statistics));
  }

  return res.status(200).json({
    message: "statistics fetched successfully",
    success: true,
    statistics,
  });
});

const getPieCharts = asyncHandler(async (req, res, next) => {
  let pieCharts;
  const key = "admin-pie-charts";

  if (myCache.has(key)) {
    pieCharts = JSON.parse(myCache.get(key));
  } else {
    const allOrderPromise = Order.find({}).select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);
    const processingOrdersPromise = Order.countDocuments({
      status: "Processing",
    });
    const shippedOrdersPromise = Order.countDocuments({ status: "Shipped" });
    const deliveredOrdersPromise = Order.countDocuments({
      status: "Delivered",
    });
    const allCategoriesPromise = Product.distinct("category");
    const totalProductsPromise = Product.countDocuments();
    const outOfStockProductsPromise = Product.countDocuments({ stock: 0 });
    const usersWithDOBPromsie = User.find({}).select(["dob"]);
    const totalAdminUsersPromise = User.countDocuments({ role: "admin" });
    const totalNormalUsersPromise = User.countDocuments({ role: "user" });

    const [
      processingOrderCount,
      shippedOrderCount,
      deliveredOrderCount,
      AllCategories,
      totalProductsCount,
      outOfStockProductsCount,
      allOrders,
      allUsers,
      adminUsersCount,
      customerUsersCount,
    ] = await Promise.all([
      processingOrdersPromise,
      shippedOrdersPromise,
      deliveredOrdersPromise,
      allCategoriesPromise,
      totalProductsPromise,
      outOfStockProductsPromise,
      allOrderPromise,
      usersWithDOBPromsie,
      totalAdminUsersPromise,
      totalNormalUsersPromise,
    ]);

    const orderFullfillment = {
      processing: processingOrderCount,
      shipped: shippedOrderCount,
      delivered: deliveredOrderCount,
    };

    const EachCategoryCountArrayPromise = AllCategories.map((category) =>
      Product.countDocuments({ category })
    );

    const EachCategoryCountArray = await Promise.all(
      EachCategoryCountArrayPromise
    );

    const EachCategoryPercentage = AllCategories.map((category, i) => ({
      [category]: Math.round(
        (EachCategoryCountArray[i] / totalProductsCount) * 100
      ),
    }));

    const stockAvailablity = {
      inStock: totalProductsCount - outOfStockProductsCount,
      outOfStcock: outOfStockProductsCount,
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin =
      grossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 18).length,
      adult: allUsers.filter((i) => i.age >= 18 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };

    const usersTypeCount = {
      admin: adminUsersCount,
      customer: customerUsersCount,
    };

    pieCharts = {
      orderFullfillment,
      EachCategoryPercentage,
      stockAvailablity,
      revenueDistribution,
      usersAgeGroup,
      usersTypeCount,
    };

    myCache.set(key, JSON.stringify(pieCharts));
  }

  return res.status(200).json({
    message:"data for creating charts fetched successfully",
    success: true,
    pieCharts,
  });
});

 const getBarCharts = asyncHandler(async (req, res, next) => {
  let barCharts;
  const key = "admin-bar-charts";

  if (myCache.has(key)){barCharts = JSON.parse(myCache.get(key) )}
  else {
    const today = new Date();
    const dateBeforeSixMonthAgo = new Date();
    dateBeforeSixMonthAgo.setMonth(today.getMonth() - 6);

    if (dateBeforeSixMonthAgo.getMonth() > today.getMonth()) {
      dateBeforeSixMonthAgo.setFullYear(today.getFullYear() - 1);
    }

    const dateBeforeTwelveMonthAgo = new Date();
    dateBeforeTwelveMonthAgo.setMonth(today.getMonth() - 12);

    const lastSixMonthProductPromise = Product.find({
      createdAt: {
        $gte: dateBeforeSixMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const lastSixMonthUsersPromise = User.find({
      createdAt: {
        $gte:  dateBeforeSixMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const lastTwelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: dateBeforeTwelveMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [lastSixMonthProducts, lastSixMonthUsers, lastTwelveMonthOrders] = await Promise.all([
      lastSixMonthProductPromise,
      lastSixMonthUsersPromise,
      lastTwelveMonthOrdersPromise,
    ]);

    const monthwiseProductCount = getMonthlyCountArray({ length: 6, todaysDate:today, docArray: lastSixMonthProducts });
    const monthwiseUsersCount = getMonthlyCountArray({ length: 6, todaysDate:today, docArray: lastSixMonthUsers });
    const monthwiseOrdersCount = getMonthlyCountArray({ length: 12, todaysDate:today, docArray: lastTwelveMonthOrders });

    barCharts = {
      users: monthwiseUsersCount ,
      products: monthwiseProductCount,
      orders: monthwiseOrdersCount,
    };

    myCache.set(key, JSON.stringify(barCharts));
  }

  return res.status(200).json({
    message:"Data for bar chart fetched successfully",
    success: true,
    barCharts,
  });
});



 const getLineCharts = asyncHandler(async (req, res, next) => {
  let lineCharts;
  const key = "admin-line-charts";

  if (myCache.has(key)) {lineCharts = JSON.parse(myCache.get(key))} 
  else {
    const today = new Date();

    const dateBeforeTwelveMonthAgo = new Date();
    dateBeforeTwelveMonthAgo.setMonth(today.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: dateBeforeTwelveMonthAgo ,
        $lte: today,
      },
    };

    const lastTwelveMonthProductsPromise = Product.find(baseQuery).select("createdAt");
    const lastTwelveMonthUsersPromise = User.find(baseQuery).select("createdAt");
    const lastTwelveMonthOrdersPromise =  Order.find(baseQuery).select(["createdAt", "discount", "total"])

    const [lasttwelveMonthProducts, lastTwelveMonthUsers, lastTwelveMonthOrders] = await Promise.all([
     lastTwelveMonthProductsPromise,
      lastTwelveMonthUsersPromise,
     lastTwelveMonthOrdersPromise,
    ]);

    const productCounts = getMonthlyCountArray({ length: 12, todaysDate:today, docArray: lasttwelveMonthProducts });
    const usersCounts = getMonthlyCountArray({ length: 12, todaysDate:today, docArray: lastTwelveMonthUsers });
    const discount = getMonthlyCountArray({
      length: 12,
      todaysDate:today,
      docArray: lastTwelveMonthOrders,
      property:"discount"
      
    });
    const revenue = getMonthlyCountArray({
      length: 12,
      todaysDate:today,
      docArray: lastTwelveMonthOrders,
      property:"total"
      
    });

    lineCharts = {
      users: usersCounts,
      products: productCounts,
      discount,
      revenue,
    };

    myCache.set(key, JSON.stringify(lineCharts));
  }

  return res.status(200).json({
    message:"Data for line chart fetched successfully",
    success: true,
    lineCharts,
  });
});

export { getStatistics, getPieCharts,getBarCharts , getLineCharts};
