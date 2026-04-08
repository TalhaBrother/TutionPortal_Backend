
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  contact: { type: String ,required:true},
  email: { type: String, required: true, unique: true},
password: { type: String, required: true},
role:{
    type:String,
    enum:['parent','admin',"tutor", "academy"],
    default: 'parent',
},
profilePic:{
  url:{type:String,},
  public_id:{type:String,}
}

  },{timestamps:true}
);
const User= mongoose.model('users', userSchema);
export default User;