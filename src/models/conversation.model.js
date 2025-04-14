import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }
    ],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
        default: null
    }
}, { timestamps: true });

conversationSchema.index(
    { "participants.0": 1, "participants.1": 1 },
    { unique: true }
);

const Conversation = mongoose.model("conversation", conversationSchema);
export default Conversation;
