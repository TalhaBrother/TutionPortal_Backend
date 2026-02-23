import express from "express";
import jwt from "jsonwebtoken";
import User from "../schema/schema.js";
import dotenv from "dotenv";
import Message from "../schema/message.js";
dotenv.config();


const messageRoute=express.Router();
let authenticateUser=async(req,res,next)=>{
    try {
        let token = req.headers?.authorization?.split(" ")[1];
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
messageRoute.use(authenticateUser)
messageRoute.get('/', async(req,res)=>{
    try {
    // Accept sender/receiver from query (preferred for GET) or body
    const senderId = req.query.senderId || req.body.senderId;
    const receiverId = req.query.receiverId || req.body.receiverId;
    if(!senderId || !receiverId){
        return res.status(400).json({message:"Bad Request senderId and receiverId are required!"});
    }
    let messageFilter = {
        $or: [
            { senderId: senderId, receiverId: receiverId },
            { senderId: receiverId, receiverId: senderId }
        ]
    };
    let messages = await Message.find(messageFilter).sort({createdAt:1});
    return res.status(200).json({
        message:"Messages fetched successfully",
        data:messages,
        code:200
    });
    
}catch (error) {
    console.error("Error in GET /messages:", error);
    return res.status(500).json({message:"Internal Server Error while fetching messages"});
}
})

messageRoute.post('/',async(req,res)=>{
    try {
        const {message, senderId, receiverId} = req.body
        if(!message || !senderId || !receiverId){
            return res.status(400).json({message:"Bad Request message, senderId and receiverId are required!"});
        }
        let newMessage = new Message({ message, senderId, receiverId });
        await newMessage.save();
        return res.status(201).json({
            message:"Message sent successfully",
            data:newMessage,
            code:201
        });
    } catch (error) {
        console.error("Error in POST /messages:", error);
        res.status(500).json({message:"Internal Server Error while sending message"});
    }
})
export default messageRoute;