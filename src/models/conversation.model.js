//Hội thoại
import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    members:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"User",
        }
    ],
    messages:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"Message",
            default:[]
        }
    ]
},{Timestamp:true});

const Conversation = mongoose.model("Conversation",conversationSchema);

export default Conversation;