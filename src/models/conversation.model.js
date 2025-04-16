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
    participantIds: [String],  // chứa userId1, userId2 đã sort
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
        default: null
    }
}, { timestamps: true });


conversationSchema.pre("save", function (next) {
    this.participants.sort((a, b) => a.user.toString().localeCompare(b.user.toString()));

    this.participantIds = this.participants.map(p => p.user.toString());

    next();
});


const Conversation = mongoose.model("conversation", conversationSchema);
export default Conversation;
