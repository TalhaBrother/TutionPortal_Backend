import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
  message: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
}, { timestamps: true });
const Message = mongoose.model('message', messageSchema);
export default Message;