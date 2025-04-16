import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
        required: false
    },
    type: {
        type: String,
        enum: ["text", "emoji", "image", "video", "file", "audio"],
        default: "text"
    },
    content: {
        type: String,
    },
    fileMeta: [
        {
            name: String,
            size: Number,
            mimeType: String,
            duration: Number,// nếu là audio/video
            url: String
        }
    ],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const Message = mongoose.model("message", messageSchema);
export default Message;
