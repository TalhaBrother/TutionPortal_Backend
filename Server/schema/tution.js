import mongoose from "mongoose";
const { Schema } = mongoose;

const tutionSchema = new Schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    subject:{type:String,required:true},
    location:{type:String,required:true},
    salary:{type:Number,required:true},
    contact:{type:String,required:true},
},{timestamps:true})
const Tution = mongoose.model("tution", tutionSchema);
export default Tution;