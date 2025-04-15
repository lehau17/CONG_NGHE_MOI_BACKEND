import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
    participants: {
        type: [participantSchema],
        validate: {
            validator: function (v) {
                return v.length === 2;
            },
            message: "A conversation must have exactly 2 participants"
        }
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
        default: null
    }
}, { timestamps: true });

// Tạo index theo userId, đảm bảo duy nhất mỗi cặp user (sắp xếp sẵn)
conversationSchema.index(
    {
        "participants.0.user": 1,
        "participants.1.user": 1
    },
    { unique: true }
);

// Trước khi lưu, đảm bảo userId được sắp xếp tăng dần
conversationSchema.pre("save", function (next) {
    this.participants.sort((a, b) => a.user.toString().localeCompare(b.user.toString()));
    next();
});

const Conversation = mongoose.model("conversation", conversationSchema);
export default Conversation;
