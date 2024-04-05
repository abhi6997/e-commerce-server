import { myCache } from "../app.js";

export const invalidateCache = async ({
  pro,
  ord,
  adm,
  userId,
  orderId,
  productId,
}) => {
  if (pro) {
    const productKeys = ["latest-product", "all-categories", "all-products"];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object") {
      productId.forEach((element) => productKeys.push(`product-${element}`));
    }
    
    myCache.del(productKeys);
  }

  if (ord) {
    const orderKeys = ["all-orders", `my-orders-${userId}`, `order-${orderId}`];
   
    myCache.del(orderKeys);
   
  }

  if (adm){

    const adminKeys = ["admin-statistics","admin-pie-charts","admin-bar-charts","admin-line-charts"];
    myCache.del(adminKeys);
  }
};
