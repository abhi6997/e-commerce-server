export const getChart = ({length,todaysDate,docArray})=>{


    const monthlyOrdersCount = new Array(length).fill(0);
    const monthlyRevenueCount = new Array(length).fill(0);

   docArray.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (todaysDate.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthDiff < length) {
        monthlyOrdersCount[length - monthDiff - 1] += 1;
        monthlyRevenueCount[length - monthDiff - 1] += order.total;
      }
    });

    return [monthlyOrdersCount,monthlyRevenueCount]
} 