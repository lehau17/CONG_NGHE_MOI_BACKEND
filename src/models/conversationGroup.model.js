import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    role: {
        type: String,
        enum: ["owner", "admin", "member"],
        default: "member"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { _id: false });

const groupConversationSchema = new mongoose.Schema({
    type: {
        type: String,
        default: "group",
        enum: ["group"],
        immutable: true // không cho sửa sau khi tạo
    },
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    participants: [participantSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
        default: null
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "message"
    }]
}, { timestamps: true });

// Đảm bảo có ít nhất một owner (người tạo nhóm)
groupConversationSchema.pre("save", function (next) {
    const ownerCount = this.participants.filter(participant => participant.role === "owner").length;
    if (ownerCount === 0) {
        this.participants.push({
            user: this.createdBy,
            role: "owner",
            joinedAt: new Date()
        });
    }
    next();
});

// Cập nhật lastMessage
groupConversationSchema.methods.updateLastMessage = async function (messageId) {
    this.lastMessage = messageId;
    await this.save();
};

// Thêm tin nhắn mới
groupConversationSchema.methods.addMessage = async function (messageId) {
    this.messages.push(messageId);
    await this.updateLastMessage(messageId);
    await this.save();
};

const GroupConversation = mongoose.model("conversationGroup", groupConversationSchema);
export default GroupConversation;
