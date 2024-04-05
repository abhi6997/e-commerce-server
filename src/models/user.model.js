import mongoose from "mongoose";
import validator from "validator";


const userSchema= new mongoose.Schema({


    _id:{
        type:String,
        required:[true,"please provide Id"]
    },
    name:{
        type:String,
        required:[true,"Please Enter your name "]
    },
    email:{
        type:String,
        required:[true,"please provide Email-Id"],
        unique:[true,"Email_id already exixts"],
        validate: validator.isEmail,
    },
    photo:{
        type:String,
        required:[true,"please attach Photo"],

    },
    role:{
        type:String,
        enum:["admin","user"],
        default:"user"

    },
    gender:{
        type:String,
        enum:["male","female"],
        required:[true,"please provide gender"]
    },
    dob:{
        type:Date,
        required:[true,"Please enter your Date of birth"]
    }




},{timestamps:true});

userSchema.virtual("age").get(function(){
    const today = new Date();
    const dob = this.dob;
    let age = today.getFullYear() - dob.getFullYear();

    if (today.getMonth() <dob.getMonth() || (today.getMonth === dob.getMonth() && today.getDate()< dob.getDate())
){
    age--;
}
return age;
})



export const User = mongoose.model("User",userSchema)