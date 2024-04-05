class ApiError  {
    constructor(statusCode, message = "Something went wrong") {
     this.statusCode = statusCode
     
     
      this.message = message;
    }
  }
  
  export { ApiError };
  

