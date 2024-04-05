const aggregateCalculator = (array) => {

  return array.reduce((sum, order) => sum + (order.total || 0), 0);

};

export default aggregateCalculator;