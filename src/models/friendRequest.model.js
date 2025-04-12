import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "blocked"],
        default: "pending",
    },
}, { timestamps: true });

const FriendRequest = mongoose.model("friendRequest", friendRequestSchema);
export default FriendRequest;
