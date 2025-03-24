//Tin nhắn
import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    message:{
        type: String,
        require: true
    }

},{Timestamp:true});

const Message = mongoose.model("Message",messageSchema);

export default Message; 