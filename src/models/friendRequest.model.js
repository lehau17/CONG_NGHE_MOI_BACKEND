import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "removed", "blocked"],
        default: "pending",
    },
}, {
    timestamps: true,
});

// Unique index để tránh trùng lời mời giữa 2 người (một chiều)
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

const FriendRequest = mongoose.model("friendRequest", friendRequestSchema);
export default FriendRequest;
