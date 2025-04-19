import mongoose from "mongoose";

const pendingGroupInviteSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "conversationGroup",
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const PendingGroupInvite = mongoose.models.pendingGroupInvite ||
    mongoose.model("pendingGroupInvite", pendingGroupInviteSchema);

export default PendingGroupInvite;
