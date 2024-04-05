export const getMonthlyCountArray = ({length,todaysDate,docArray,property})=>{


    const monthlyCountArray = new Array(length).fill(0);
   

   docArray.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (todaysDate.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthDiff < length) {

        if (property){
          monthlyCountArray[length - monthDiff - 1] +=order[property]
        }else{
          monthlyCountArray[length - monthDiff - 1] += 1;
        }
       
        
      }
    });

    return monthlyCountArray;
} 