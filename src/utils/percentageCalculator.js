const percentageCalculator=(thisMonth,lastMonth)=>{

     let percentage;
    if (lastMonth === 0){
         percentage = thisMonth*100
    }else{
        percentage = (thisMonth-lastMonth)/lastMonth*100
    }

    return percentage.toFixed();

   

    

}
export {percentageCalculator}