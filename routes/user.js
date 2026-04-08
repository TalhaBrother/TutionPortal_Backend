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
        let getUser=await User.findById(decoded?.id).select("-password");
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
        let user=req.user
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

// Update user details
userRoute.put("/update/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
        
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found", code: 404 });
        }

        return res.status(200).json({
            message: "User updated successfully",
            data: updatedUser,
            code: 200
        });
    } catch (error) {
        console.error("Error in PUT /users/update/:id:", error);
        return res.status(500).json({ message: "Internal Server Error while updating user" });
    }
});

// Delete user
userRoute.delete("/delete/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found", code: 404 });
        }

        return res.status(200).json({
            message: "User deleted successfully",
            code: 200
        });
    } catch (error) {
        console.error("Error in DELETE /users/delete/:id:", error);
        return res.status(500).json({ message: "Internal Server Error while deleting user" });
    }
});

export default userRoute;