import User from"../schema/schema.js";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const userRoute=express.Router();
let authenticateUser=async(req,res,next)=>{
    try {
        let token=req?.headers?.authorization?.split(" ")[1];
        if(!token){
            return res.status(401).json({message:"Unauthorized access No token provided!"});
        }
        let decoded=jwt.verify(token,process.env.secretKey);
        if(!decoded){
            return res.status(401).json({message:"Unauthorized access Invalid token!"});
        }
        let getUser=await User.findById(decoded?._id).select("-password");
        if(!getUser){
            return res.status(401).json({message:"Unauthorized access User not found!"});
        }
        req.user=getUser;
        next();
    } catch (error) {
        console.error("Error in authenticateUser middleware:", error);
        return res.status(500).json({message:"Internal Server Error from messages route"});
    }
}
userRoute.use(authenticateUser)
userRoute.get("/",async(req,res)=>{
    try {
        let user=req.body
        let users=await User.find({email:{$ne:user.email}}).select("-password")
        return res.status(200).json({
            message:"Users fetched successfully",
            data:users,
            code:200
        });
    } catch (error) {
        console.error("Error in GET /users:", error);
        return res.status(500).json({message:"Internal Server Error while fetching users"});

    }
})
userRoute.get("/:id",async(req,res)=>{
    try {
        let userId=req.params.id
        let user=await User.findById(userId).select("-password")
        return res.status(200).json({
            message:"User fetched successfully",
            data:user,
            code:200
        });
    } catch (error) {
        console.error("Error in GET /users/:id:", error);
        return res.status(500).json({message:"Internal Server Error while fetching user"});
    }
})

export default userRoute;