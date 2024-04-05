import dotenv from "dotenv"
import connectDB from "./db/mongodbConnection.js"
import { app } from "./app.js";

dotenv.config({
    path:"./env"
})
const port = process.env.PORT || 8000 
connectDB().then(()=>{
    
    app.listen(port,()=>{
        console.log("server is running at port: ",port)
    })
   
    app.on("error",(error)=>{
        console.log("server failed!!!! due to: ", error)
        throw error
    })

}).catch((error)=>{
    console.log("MongoDB Connection Failed!!!!",error)
})

