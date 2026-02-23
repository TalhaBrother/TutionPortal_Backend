
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  age: { type: Number, required: true },
  contact: { type: String ,required:true},
  email: { type: String, required: true, unique: true},
password: { type: String, required: true},
role:{
    type:String,
    enum:['user','admin'],
    default: 'user',
},
profilePic:{
  url:{type:String,},
  public_id:{type:String,}
}

  },{timestamps:true}
);
const User= mongoose.model('users', userSchema);
export default User;