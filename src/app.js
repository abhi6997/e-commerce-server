import express from "express";
import Stripe from "stripe";
const app = express();
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors"
import morgan from "morgan";
import NodeCache from "node-cache";
import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js"
import orderRouter from "./routes/order.route.js"
import paymentRouter from "./routes/payment.route.js";
import statsRouter from "./routes/statistics.route.js"
app.use(morgan("dev"));
const stripeKey = process.env.STRIPE_KEY || "";
const stripe = new Stripe(stripeKey)
const myCache = new NodeCache();
app.use(express.json({limit:"16kb"}))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))
app.use(cookieParser())
app.get("/",(req,res)=>{
    res.send("Api Working with /api/v1/users")
})

app.use("/api/v1/users",userRouter)
app.use("/api/v1/products",productRouter)
app.use("/api/v1/orders",orderRouter)
app.use("/api/v1/payment",paymentRouter);
app.use("/api/v1/dashboard",statsRouter)


export {app,myCache,stripe}